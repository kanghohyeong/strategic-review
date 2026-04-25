import path from 'path'
import { Report, ReportGroup, PaginatedGroups } from '../../domain/report/report'
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

  getReportByFilename(filename: string): Report {
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
    const report = this.repo.findByFilename(filename)
    report.approve(comment)
    this.repo.updateStatus(filename, report.status, report.reviewComment)
  }

  rejectReport(filename: string, comment: string): string {
    const rejected = this.repo.findByFilename(filename)
    rejected.reject(comment)
    this.repo.updateStatus(filename, rejected.status, rejected.reviewComment)
    const next = rejected.nextRevision()
    this.repo.insertReport(next.prefix, next.version)
    this.repo.updateStatus(next.filename, next.status, next.reviewComment)
    return next.filename
  }

  submitReport(filename: string, content: string): void {
    if (!isValidFilename(filename)) throw new Error('Invalid filename')
    const report = this.repo.findByFilename(filename)
    report.submit(content)
    this.repo.updateContentAndStatus(filename, report.content, report.status)
  }

  deleteReport(filename: string): void {
    if (!isValidFilename(filename)) throw new Error('Invalid filename')
    const report = this.repo.findByFilename(filename)
    this.repo.deleteGroup(report.prefix)
  }

  isValidFilename(filename: string): boolean {
    return isValidFilename(filename)
  }

  getStrategicRelDir(): string {
    const rel = path.relative(process.cwd(), STRATEGIC_DIR)
    return rel.startsWith('..') ? STRATEGIC_DIR : rel
  }
}
