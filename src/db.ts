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
    CREATE TABLE IF NOT EXISTS reports (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      filename        TEXT    NOT NULL UNIQUE,
      prefix          TEXT    NOT NULL,
      version         INTEGER NOT NULL,
      name            TEXT    NOT NULL DEFAULT '',
      objective       TEXT    NOT NULL DEFAULT '',
      constraints     TEXT    NOT NULL DEFAULT '',
      status          TEXT    NOT NULL DEFAULT 'init'
                      CHECK(status IN ('init','submit','approve','reject','revision')),
      review_comment  TEXT,
      content         TEXT    NOT NULL DEFAULT '',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_reports_prefix
      ON reports(prefix);
    CREATE INDEX IF NOT EXISTS idx_reports_prefix_version
      ON reports(prefix, version DESC);
  `)
}

export function getDb(): Database.Database {
  if (!_db) {
    const dir = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')
    initDb(dir)
  }
  return _db!
}
