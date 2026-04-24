import Database from 'better-sqlite3'
import path from 'path'

let _db: Database.Database | null = null

function migrateIfNeeded(db: Database.Database): void {
  const hasNameCol = db
    .prepare("SELECT 1 FROM pragma_table_info('reports') WHERE name='name'")
    .get()

  if (!hasNameCol) return

  db.transaction(() => {
    db.exec(`
      CREATE TABLE report_groups (
        prefix      TEXT PRIMARY KEY,
        name        TEXT NOT NULL DEFAULT '',
        objective   TEXT NOT NULL DEFAULT '',
        constraints TEXT NOT NULL DEFAULT '',
        created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
      INSERT INTO report_groups (prefix, name, objective, constraints, created_at)
        SELECT prefix, MAX(name), MAX(objective), MAX(constraints), MIN(created_at)
        FROM reports GROUP BY prefix;
      CREATE TABLE reports_new (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        filename       TEXT    NOT NULL UNIQUE,
        prefix         TEXT    NOT NULL REFERENCES report_groups(prefix) ON DELETE CASCADE,
        version        INTEGER NOT NULL,
        status         TEXT    NOT NULL DEFAULT 'init'
                       CHECK(status IN ('init','submit','approve','reject','revision')),
        review_comment TEXT,
        content        TEXT    NOT NULL DEFAULT '',
        created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
      );
      INSERT INTO reports_new (id, filename, prefix, version, status, review_comment, content, created_at)
        SELECT id, filename, prefix, version, status, review_comment, content, created_at FROM reports;
      DROP INDEX IF EXISTS idx_reports_prefix;
      DROP INDEX IF EXISTS idx_reports_prefix_version;
      DROP TABLE reports;
      ALTER TABLE reports_new RENAME TO reports;
      CREATE INDEX idx_reports_prefix         ON reports(prefix);
      CREATE INDEX idx_reports_prefix_version ON reports(prefix, version DESC);
    `)
  })()
}

export function initDb(strategicDirOrMemory: string): void {
  const dbPath =
    strategicDirOrMemory === ':memory:' ? ':memory:' : path.join(strategicDirOrMemory, 'strategic.db')

  if (_db) _db.close()

  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  migrateIfNeeded(_db)

  _db.exec(`
    CREATE TABLE IF NOT EXISTS report_groups (
      prefix      TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT '',
      objective   TEXT NOT NULL DEFAULT '',
      constraints TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS reports (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      filename       TEXT    NOT NULL UNIQUE,
      prefix         TEXT    NOT NULL REFERENCES report_groups(prefix) ON DELETE CASCADE,
      version        INTEGER NOT NULL,
      status         TEXT    NOT NULL DEFAULT 'init'
                     CHECK(status IN ('init','submit','approve','reject','revision')),
      review_comment TEXT,
      content        TEXT    NOT NULL DEFAULT '',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
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
