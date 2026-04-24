import fs from 'fs'
import path from 'path'
import { ReportFile, ReportGroup, ReportStatus, PaginatedGroups } from './types'
import { getDb } from './db'

const STRATEGIC_DIR = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')
// prefix는 YYYYMMDD_HHMMSS 또는 충돌 시 YYYYMMDD_HHMMSS_N 형태
const FILENAME_REGEX = /^\d{8}_\d{6}(_\d+)?\.v\d+\.md$/
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

export function ensureStrategicDir(): void {
  fs.mkdirSync(STRATEGIC_DIR, { recursive: true })
}

export function isValidFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename)
}

export function parseFilename(filename: string): { prefix: string; version: number } {
  const match = filename.match(/^(\d{8}_\d{6}(?:_\d+)?)\.v(\d+)\.md$/)
  if (!match) throw new Error(`Invalid filename: ${filename}`)
  return {
    prefix: match[1],
    version: parseInt(match[2], 10),
  }
}

export function getPaginatedGroups(page: number): PaginatedGroups {
  const db = getDb()

  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM report_groups')
    .get() as { total: number }

  const totalCount = total
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const offset = (safePage - 1) * PAGE_SIZE

  const prefixRows = db
    .prepare('SELECT prefix FROM report_groups ORDER BY prefix DESC LIMIT ? OFFSET ?')
    .all(PAGE_SIZE, offset) as { prefix: string }[]

  const prefixes = prefixRows.map((r) => r.prefix)

  if (prefixes.length === 0) {
    return { groups: [], currentPage: safePage, totalPages, totalCount }
  }

  const placeholders = prefixes.map(() => '?').join(',')
  const rows = db
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
    const allFilesParsed = (groupMap.get(prefix) ?? []).map(rowToReportFile)
    return {
      prefix,
      latestFile: allFilesParsed[0],
      allFiles: allFilesParsed,
    }
  })

  return { groups, currentPage: safePage, totalPages, totalCount }
}

export function getReportByFilename(filename: string): ReportFile {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')
  const db = getDb()
  const row = db
    .prepare(
      `SELECT r.*, g.name, g.objective, g.constraints
       FROM reports r JOIN report_groups g USING (prefix)
       WHERE r.filename = ?`
    )
    .get(filename) as ReportRowWithGroup | undefined
  if (!row) throw new Error(`Report not found: ${filename}`)
  return rowToReportFile(row)
}

export function getGroupByPrefix(prefix: string): ReportGroup {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT r.*, g.name, g.objective, g.constraints
       FROM reports r JOIN report_groups g USING (prefix)
       WHERE r.prefix = ? ORDER BY r.version DESC`
    )
    .all(prefix) as ReportRowWithGroup[]

  if (rows.length === 0) throw new Error(`No files found for prefix: ${prefix}`)

  const allFilesParsed = rows.map(rowToReportFile)
  return {
    prefix,
    latestFile: allFilesParsed[0],
    allFiles: allFilesParsed,
  }
}

export function createReport(params: {
  name: string
  objective: string
  constraints: string
}): string {
  const db = getDb()

  const now = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const basePrefix = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')

  const insertGroup = db.prepare(
    `INSERT OR IGNORE INTO report_groups (prefix, name, objective, constraints)
     VALUES (?, ?, ?, ?)`
  )
  const insertReport = db.prepare(
    `INSERT INTO reports (filename, prefix, version, status, content)
     VALUES (?, ?, 1, 'init', '')`
  )

  for (let counter = 0; counter < 1000; counter++) {
    const prefix = counter === 0 ? basePrefix : `${basePrefix}_${counter}`
    const filename = `${prefix}.v1.md`
    try {
      db.transaction(() => {
        insertGroup.run(prefix, params.name, params.objective, params.constraints)
        insertReport.run(filename, prefix)
      })()
      return filename
    } catch (err: unknown) {
      const sqliteErr = err as { code?: string }
      if (sqliteErr.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw err
    }
  }

  throw new Error('Could not create a unique report filename')
}

export function approveReport(filename: string, comment?: string): void {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')
  const db = getDb()
  const result = db
    .prepare(
      `UPDATE reports SET status = 'approve', review_comment = ? WHERE filename = ?`
    )
    .run(comment ?? null, filename)
  if (result.changes === 0) throw new Error(`Report not found: ${filename}`)
}

export function rejectReport(filename: string, comment: string): string {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')
  const db = getDb()

  let newFilename = ''

  const transaction = db.transaction(() => {
    const updateResult = db
      .prepare(
        `UPDATE reports SET status = 'reject', review_comment = ? WHERE filename = ?`
      )
      .run(comment, filename)

    if (updateResult.changes === 0) throw new Error(`Report not found: ${filename}`)

    const row = db
      .prepare('SELECT * FROM reports WHERE filename = ?')
      .get(filename) as ReportRow

    newFilename = `${row.prefix}.v${row.version + 1}.md`

    db.prepare(
      `INSERT INTO reports (filename, prefix, version, status, content)
       VALUES (?, ?, ?, 'revision', '')`
    ).run(newFilename, row.prefix, row.version + 1)
  })

  transaction()
  return newFilename
}

export function submitReport(filename: string, content: string): void {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')
  const db = getDb()
  const result = db
    .prepare(`UPDATE reports SET content = ?, status = 'submit' WHERE filename = ?`)
    .run(content, filename)
  if (result.changes === 0) throw new Error(`Report not found: ${filename}`)
}

export function getStrategicRelDir(): string {
  const rel = path.relative(process.cwd(), STRATEGIC_DIR)
  return rel.startsWith('..') ? STRATEGIC_DIR : rel
}
