import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { ReportFile, ReportGroup, ReportStatus, PaginatedGroups } from './types'

const STRATEGIC_DIR = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')
const FILENAME_REGEX = /^\d{8}_\d{6}\.v\d+\.md$/
const PAGE_SIZE = 10

export function ensureStrategicDir(): void {
  fs.mkdirSync(STRATEGIC_DIR, { recursive: true })
}

export function isValidFilename(filename: string): boolean {
  return FILENAME_REGEX.test(filename)
}

export function parseFilename(filename: string): { prefix: string; version: number } {
  const match = filename.match(/^(\d{8}_\d{6})\.v(\d+)\.md$/)
  if (!match) throw new Error(`Invalid filename: ${filename}`)
  return {
    prefix: match[1],
    version: parseInt(match[2], 10),
  }
}

function parseReportFile(filename: string): ReportFile {
  const filePath = path.join(STRATEGIC_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)
  const { prefix, version } = parseFilename(filename)

  return {
    filename,
    prefix,
    version,
    name: String(parsed.data.name ?? ''),
    objective: String(parsed.data.objective ?? ''),
    constraints: String(parsed.data.constraints ?? ''),
    status: (parsed.data.status ?? 'init') as ReportStatus,
    reviewComment: parsed.data['review-comment']
      ? String(parsed.data['review-comment'])
      : undefined,
    content: parsed.content.trim(),
  }
}

export function getPaginatedGroups(page: number): PaginatedGroups {
  ensureStrategicDir()

  const allFiles = fs.readdirSync(STRATEGIC_DIR).filter(isValidFilename)

  const prefixMap = new Map<string, string[]>()
  for (const filename of allFiles) {
    const { prefix } = parseFilename(filename)
    if (!prefixMap.has(prefix)) prefixMap.set(prefix, [])
    prefixMap.get(prefix)!.push(filename)
  }

  const sortedPrefixes = Array.from(prefixMap.keys()).sort((a, b) => b.localeCompare(a))
  const totalCount = sortedPrefixes.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const slicedPrefixes = sortedPrefixes.slice(startIdx, startIdx + PAGE_SIZE)

  const groups: ReportGroup[] = slicedPrefixes.map((prefix) => {
    const filenames = prefixMap.get(prefix)!.sort((a, b) => {
      const va = parseFilename(a).version
      const vb = parseFilename(b).version
      return vb - va
    })
    const allFilesParsed = filenames.map(parseReportFile)
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
  return parseReportFile(filename)
}

export function getGroupByPrefix(prefix: string): ReportGroup {
  ensureStrategicDir()

  const allFiles = fs.readdirSync(STRATEGIC_DIR).filter(isValidFilename)
  const filenames = allFiles
    .filter((f) => f.startsWith(prefix))
    .sort((a, b) => parseFilename(b).version - parseFilename(a).version)

  if (filenames.length === 0) {
    throw new Error(`No files found for prefix: ${prefix}`)
  }

  const allFilesParsed = filenames.map(parseReportFile)
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
  ensureStrategicDir()

  const now = new Date()
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const prefix = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '_',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')

  const filename = `${prefix}.v1.md`
  const filePath = path.join(STRATEGIC_DIR, filename)

  const frontmatter = {
    name: params.name,
    objective: params.objective,
    constraints: params.constraints,
    status: 'init',
  }

  const fileContent = matter.stringify('', frontmatter)
  fs.writeFileSync(filePath, fileContent, 'utf-8')

  return filename
}

export function approveReport(filename: string, comment?: string): void {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')

  const filePath = path.join(STRATEGIC_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)

  parsed.data.status = 'approve'
  if (comment) {
    parsed.data['review-comment'] = comment
  } else {
    delete parsed.data['review-comment']
  }

  const updated = matter.stringify(parsed.content, parsed.data)
  fs.writeFileSync(filePath, updated, 'utf-8')
}

export function rejectReport(filename: string, comment: string): string {
  if (!isValidFilename(filename)) throw new Error('Invalid filename')

  const filePath = path.join(STRATEGIC_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)

  parsed.data.status = 'reject'
  parsed.data['review-comment'] = comment

  const updated = matter.stringify(parsed.content, parsed.data)
  fs.writeFileSync(filePath, updated, 'utf-8')

  const { prefix, version } = parseFilename(filename)
  const newFilename = `${prefix}.v${version + 1}.md`
  const newFilePath = path.join(STRATEGIC_DIR, newFilename)

  const newFrontmatter = {
    name: String(parsed.data.name ?? ''),
    objective: String(parsed.data.objective ?? ''),
    constraints: String(parsed.data.constraints ?? ''),
    status: 'revision' as ReportStatus,
  }
  fs.writeFileSync(newFilePath, matter.stringify('', newFrontmatter), 'utf-8')

  return newFilename
}

export function getStrategicRelDir(): string {
  const rel = path.relative(process.cwd(), STRATEGIC_DIR)
  return rel.startsWith('..') ? STRATEGIC_DIR : rel
}
