import { useEffect, useState } from 'react'
import { FileSpreadsheet, Download } from 'lucide-react'
import { api, type AdminReportsResponse } from '../../lib/api'
import DataTable, { type Column } from './common/DataTable'

export default function AdminReportsView() {
  const [range, setRange] = useState('week')
  const [data, setData] = useState<AdminReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function loadReport() {
    setLoading(true)
    setError(null)
    api
      .adminGetReports(range)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to generate report.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadReport()
  }, [range])

  function handleDownloadCsv() {
    window.open(api.adminGetReportsCsvUrl(range), '_blank')
  }

  const columns: Column<any>[] = [
    {
      key: 'employeeName',
      label: 'Employee Name',
      sortable: true,
      render: (row) => <span className="font-bold text-ink dark:text-white">{row.employeeName}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <span className="text-slate-600 dark:text-slate-300">{row.role}</span>,
    },
    {
      key: 'projectName',
      label: 'Project',
      render: (row) => (
        <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          {row.projectName}
        </span>
      ),
    },
    {
      key: 'sessionCount',
      label: 'Sessions',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-700 dark:text-slate-300">{row.sessionCount}</span>,
    },
    {
      key: 'totalHours',
      label: 'Total Hours Logged',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-brand-600 dark:text-brand-400">{row.totalHours} hrs</span>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink dark:text-white">Enterprise Reporting & Payroll Export</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Summarized work hours and session counts across team members
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-850">
            {['today', 'week', 'month'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  range === r
                    ? 'bg-white text-ink shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-ink dark:text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-emerald-700 transition-colors"
          >
            <Download size={15} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* Report Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={loading}
        error={error}
        emptyMessage="No time tracking logs found for this report range."
      />
    </div>
  )
}
