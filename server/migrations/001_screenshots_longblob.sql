-- Migrate `screenshots` from on-disk files to MySQL LONGBLOB storage.
--
-- schema.sql only creates tables IF NOT EXISTS, so an existing database needs
-- this one-off ALTER. Apply with:
--   mysql -u activityiq -p activityiq < server/migrations/001_screenshots_longblob.sql
--
-- Rows are dropped rather than backfilled when they carry no image: the old
-- seed inserted screenshot rows with no file at all, and `image` is NOT NULL.
-- Backfill any rows whose file still exists on disk BEFORE running this.

ALTER TABLE screenshots
  ADD COLUMN image LONGBLOB NULL AFTER captured_at,
  ADD COLUMN image_mime VARCHAR(64) NOT NULL DEFAULT 'image/jpeg' AFTER image,
  ADD COLUMN active_window VARCHAR(512) NULL AFTER image_mime,
  ADD COLUMN ai_summary TEXT NULL AFTER active_window,
  ADD COLUMN productivity_score INT NULL AFTER ai_summary,
  ADD COLUMN created_at VARCHAR(64) NULL AFTER ocr_text;

UPDATE screenshots SET created_at = captured_at WHERE created_at IS NULL;

-- Any screenshot with no bytes cannot satisfy `image LONGBLOB NOT NULL`.
DELETE FROM screenshots WHERE image IS NULL;

ALTER TABLE screenshots
  MODIFY COLUMN image LONGBLOB NOT NULL,
  MODIFY COLUMN created_at VARCHAR(64) NOT NULL,
  MODIFY COLUMN entry_id VARCHAR(128) NULL,
  DROP COLUMN file_path;

ALTER TABLE screenshots
  ADD INDEX idx_screenshots_employee_captured (employee_id, captured_at);
