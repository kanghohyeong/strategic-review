import Database from 'better-sqlite3'
import path from 'path'

let _db: Database.Database | null = null

export function initDb(strategicDirOrMemory: string): void {
  const dbPath =
    strategicDirOrMemory === ':memory:' ? ':memory:' : path.join(strategicDirOrMemory, 'strategic.db')

  if (_db) _db.close()

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS report_groups (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      prefix      TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL DEFAULT '',
      objective   TEXT NOT NULL DEFAULT '',
      constraints TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id       INTEGER NOT NULL REFERENCES report_groups(id) ON DELETE CASCADE,
      version        INTEGER NOT NULL,
      status         TEXT NOT NULL DEFAULT 'init'
                     CHECK(status IN ('init','submit','approve','reject','revision')),
      review_comment TEXT,
      content        TEXT NOT NULL DEFAULT '',
      created_at     TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(group_id, version)
    );
    CREATE INDEX IF NOT EXISTS idx_reports_group_id
      ON reports(group_id);
    CREATE INDEX IF NOT EXISTS idx_reports_group_version
      ON reports(group_id, version DESC);
  `)
}

export function getDb(): Database.Database {
  if (!_db) {
    const dir = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')
    initDb(dir)
  }
  return _db!
}
