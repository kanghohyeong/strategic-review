import { Report, ReportGroup, PaginatedGroups } from '../../../domain/report/report'

export interface ReportServicePort {
  createReport(params: { name: string; objective: string; constraints: string }): string
  getReportByFilename(filename: string): Report
  getGroupByPrefix(prefix: string): ReportGroup
  getPaginatedGroups(page: number): PaginatedGroups
  approveReport(filename: string, comment?: string): void
  rejectReport(filename: string, comment: string): string
  submitReport(filename: string, content: string): void
  isValidFilename(filename: string): boolean
  getStrategicRelDir(): string
}
