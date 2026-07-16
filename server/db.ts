import mysql from 'mysql2/promise'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load DB_* / DATABASE_URL from a local .env file if present. Node 20.6+ exposes
// process.loadEnvFile(); ignore the error when no .env exists so that
// environments that inject real env vars (CI, Docker, prod) still work.
try {
  process.loadEnvFile()
} catch {
  // no .env file — rely on the ambient environment
}

let pool: mysql.Pool | null = null

/**
 * Build the pool config from the environment. DATABASE_URL wins when set (it is
 * the one variable most hosts inject); otherwise fall back to discrete DB_* vars.
 */
function poolOptions(): mysql.PoolOptions {
  const shared: mysql.PoolOptions = {
    waitForConnections: true,
    // Cap concurrent connections so a traffic spike queues instead of exhausting
    // MySQL's max_connections.
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
    queueLimit: 0,
    enableKeepAlive: true,
    // Keep SUM()/DECIMAL aggregates as JS numbers rather than strings, which is
    // what every caller of all()/get() already assumes.
    decimalNumbers: true,
  }

  const url = process.env.DATABASE_URL
  if (url) return { ...shared, uri: url }

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env
  if (!DB_HOST || !DB_NAME || !DB_USER) {
    throw new Error(
      'No database configuration found. Set DATABASE_URL (e.g. mysql://user:pass@localhost:3306/activityiq), ' +
        'or DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD. See .env.example.',
    )
  }

  return {
    ...shared,
    host: DB_HOST,
    port: Number(DB_PORT) || 3306,
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD ?? '',
  }
}

/** The shared connection pool. Created once, reused by every query. */
export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(poolOptions())
  }
  return pool
}

/**
 * Split schema.sql into individual statements. mysql2 runs one statement per
 * query() call by default (multipleStatements is off, and enabling it widens
 * the SQL-injection surface), so the file is executed statement by statement.
 */
function readSchemaStatements(): string[] {
  const sql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8')
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

/** Create the schema if it does not exist. Call once at startup before serving. */
export async function initDb(): Promise<void> {
  const p = getPool()

  // Fail fast with a readable message: without this, a bad host or password
  // surfaces later as an opaque error on the first real query.
  try {
    const conn = await p.getConnection()
    conn.release()
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not connect to MySQL: ${reason}`)
  }

  for (const statement of readSchemaStatements()) {
    await p.query(statement)
  }
}

/** Run a SELECT and return all rows. */
export async function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params)
  return rows as T[]
}

/** Run a SELECT and return the first row (or undefined). */
export async function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await all<T>(sql, params)
  return rows[0]
}

/** Run an INSERT/UPDATE/DELETE. */
export async function run(sql: string, params: unknown[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().query(sql, params)
  return result as mysql.ResultSetHeader
}

/** Close the pool so the process can exit cleanly. */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}
