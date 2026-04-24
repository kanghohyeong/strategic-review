import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { initDb, getDb } from './infrastructure/db'
import { isValidFilename, parseFilename } from './domain/filename.utils'

const strategicDir = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')

initDb(strategicDir)
const db = getDb()

const files = fs.readdirSync(strategicDir).filter(isValidFilename)

const insert = db.prepare(
  `INSERT OR IGNORE INTO reports (filename, prefix, version, name, objective, constraints, status, review_comment, content)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
)

let migrated = 0
let skipped = 0

for (const filename of files) {
  const filePath = path.join(strategicDir, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = matter(raw)
  const { prefix, version } = parseFilename(filename)

  const result = insert.run(
    filename,
    prefix,
    version,
    String(parsed.data.name ?? ''),
    String(parsed.data.objective ?? ''),
    String(parsed.data.constraints ?? ''),
    String(parsed.data.status ?? 'init'),
    parsed.data['review-comment'] ? String(parsed.data['review-comment']) : null,
    parsed.content.trim()
  )

  if (result.changes > 0) {
    migrated++
    console.log(`  migrated: ${filename}`)
  } else {
    skipped++
    console.log(`  skipped (already exists): ${filename}`)
  }
}

console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped`)
