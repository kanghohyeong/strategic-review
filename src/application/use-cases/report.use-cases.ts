import path from 'path'
import { ReportFile, ReportGroup, PaginatedGroups } from '../../domain/report/report'
import { ReportRepositoryPort } from '../ports/outbound/report.repository.port'
import { ReportServicePort } from '../ports/inbound/report.service.port'
import { isValidFilename, generatePrefix } from '../../domain/report/filename.utils'

const STRATEGIC_DIR = process.env.STRATEGIC_DIR || path.join(process.cwd(), '.strategic')

export class ReportUseCases implements ReportServicePort {
  constructor(private readonly repo: ReportRepositoryPort) {}

  createReport(params: { name: string; objective: string; constraints: string }): string {
    const now = new Date()
    for (let counter = 0; counter < 1000; counter++) {
      const prefix = generatePrefix(now, counter)
      const filename = `${prefix}.v1.md`
      if (!this.repo.filenameExists(filename)) {
        this.repo.createGroupIfNotExists(prefix, params.name, params.objective, params.constraints)
        this.repo.insertReport(prefix, 1)
        return filename
      }
    }
    throw new Error('Could not create a unique report filename')
  }

  getReportByFilename(filename: string): ReportFile {
    if (!isValidFilename(filename)) throw new Error('Invalid filename')
    return this.repo.findByFilename(filename)
  }

  getGroupByPrefix(prefix: string): ReportGroup {
    return this.repo.findGroupByPrefix(prefix)
  }

  getPaginatedGroups(page: number): PaginatedGroups {
    return this.repo.getPaginatedGroups(page)
  }

  approveReport(filename: string, comment?: string): void {
    this.repo.updateStatus(filename, 'approve', comment)
  }

  rejectReport(filename: string, comment: string): string {
    this.repo.updateStatus(filename, 'reject', comment)
    const rejected = this.repo.findByFilename(filename)
    const newVersion = rejected.version + 1
    const newFilename = `${rejected.prefix}.v${newVersion}.md`
    this.repo.insertReport(rejected.prefix, newVersion)
    this.repo.updateStatus(newFilename, 'revision', comment)
    return newFilename
  }

  submitReport(filename: string, content: string): void {
    if (!isValidFilename(filename)) throw new Error('Invalid filename')
    this.repo.updateContentAndStatus(filename, content, 'submit')
  }

  isValidFilename(filename: string): boolean {
    return isValidFilename(filename)
  }

  getStrategicRelDir(): string {
    const rel = path.relative(process.cwd(), STRATEGIC_DIR)
    return rel.startsWith('..') ? STRATEGIC_DIR : rel
  }
}
