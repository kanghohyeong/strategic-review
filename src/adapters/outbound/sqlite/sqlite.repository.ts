import Database from 'better-sqlite3'
import { ReportFile, ReportGroup, PaginatedGroups, ReportStatus } from '../../../types'
import { ReportRepositoryPort } from '../../../domain/ports/report.repository.port'

const PAGE_SIZE = 10

interface ReportRow {
  id: number
  filename: string
  prefix: string
  version: number
  status: string
  review_comment: string | null
  content: string
  created_at: string
}

interface ReportRowWithGroup extends ReportRow {
  name: string
  objective: string
  constraints: string
}

function rowToReportFile(row: ReportRowWithGroup): ReportFile {
  return {
    filename: row.filename,
    prefix: row.prefix,
    version: row.version,
    name: row.name,
    objective: row.objective,
    constraints: row.constraints,
    status: row.status as ReportStatus,
    reviewComment: row.review_comment ?? undefined,
    content: row.content,
  }
}

export class SqliteRepository implements ReportRepositoryPort {
  constructor(private readonly db: Database.Database) {}

  createGroupIfNotExists(prefix: string, name: string, objective: string, constraints: string): boolean {
    const result = this.db
      .prepare('INSERT OR IGNORE INTO report_groups (prefix, name, objective, constraints) VALUES (?, ?, ?, ?)')
      .run(prefix, name, objective, constraints)
    return result.changes > 0
  }

  insertReport(filename: string, prefix: string, version: number): void {
    this.db
      .prepare("INSERT INTO reports (filename, prefix, version, status, content) VALUES (?, ?, ?, 'init', '')")
      .run(filename, prefix, version)
  }

  filenameExists(filename: string): boolean {
    const row = this.db.prepare('SELECT 1 FROM reports WHERE filename = ?').get(filename)
    return row !== undefined
  }

  findByFilename(filename: string): ReportFile {
    const row = this.db
      .prepare(
        `SELECT r.*, g.name, g.objective, g.constraints
         FROM reports r JOIN report_groups g USING (prefix)
         WHERE r.filename = ?`
      )
      .get(filename) as ReportRowWithGroup | undefined
    if (!row) throw new Error(`Report not found: ${filename}`)
    return rowToReportFile(row)
  }

  findGroupByPrefix(prefix: string): ReportGroup {
    const rows = this.db
      .prepare(
        `SELECT r.*, g.name, g.objective, g.constraints
         FROM reports r JOIN report_groups g USING (prefix)
         WHERE r.prefix = ? ORDER BY r.version DESC`
      )
      .all(prefix) as ReportRowWithGroup[]
    if (rows.length === 0) throw new Error(`No files found for prefix: ${prefix}`)
    const allFiles = rows.map(rowToReportFile)
    return { prefix, latestFile: allFiles[0], allFiles }
  }

  getPaginatedGroups(page: number): PaginatedGroups {
    const { total } = this.db
      .prepare('SELECT COUNT(*) AS total FROM report_groups')
      .get() as { total: number }

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const offset = (safePage - 1) * PAGE_SIZE

    const prefixRows = this.db
      .prepare('SELECT prefix FROM report_groups ORDER BY prefix DESC LIMIT ? OFFSET ?')
      .all(PAGE_SIZE, offset) as { prefix: string }[]

    const prefixes = prefixRows.map((r) => r.prefix)
    if (prefixes.length === 0) return { groups: [], currentPage: safePage, totalPages, totalCount: total }

    const placeholders = prefixes.map(() => '?').join(',')
    const rows = this.db
      .prepare(
        `SELECT r.*, g.name, g.objective, g.constraints
         FROM reports r JOIN report_groups g USING (prefix)
         WHERE r.prefix IN (${placeholders})
         ORDER BY r.prefix DESC, r.version DESC`
      )
      .all(...prefixes) as ReportRowWithGroup[]

    const groupMap = new Map<string, ReportRowWithGroup[]>()
    for (const row of rows) {
      if (!groupMap.has(row.prefix)) groupMap.set(row.prefix, [])
      groupMap.get(row.prefix)!.push(row)
    }

    const groups: ReportGroup[] = prefixes.map((prefix) => {
      const allFiles = (groupMap.get(prefix) ?? []).map(rowToReportFile)
      return { prefix, latestFile: allFiles[0], allFiles }
    })

    return { groups, currentPage: safePage, totalPages, totalCount: total }
  }

  updateStatus(filename: string, status: ReportStatus, comment?: string): void {
    const result = this.db
      .prepare('UPDATE reports SET status = ?, review_comment = ? WHERE filename = ?')
      .run(status, comment ?? null, filename)
    if (result.changes === 0) throw new Error(`Report not found: ${filename}`)
  }

  updateContentAndStatus(filename: string, content: string, status: ReportStatus): void {
    const result = this.db
      .prepare('UPDATE reports SET content = ?, status = ? WHERE filename = ?')
      .run(content, status, filename)
    if (result.changes === 0) throw new Error(`Report not found: ${filename}`)
  }
}
