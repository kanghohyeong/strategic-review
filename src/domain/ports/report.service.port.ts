import { ReportFile, ReportGroup, PaginatedGroups } from '../../types'

export interface ReportServicePort {
  createReport(params: { name: string; objective: string; constraints: string }): string
  getReportByFilename(filename: string): ReportFile
  getGroupByPrefix(prefix: string): ReportGroup
  getPaginatedGroups(page: number): PaginatedGroups
  approveReport(filename: string, comment?: string): void
  rejectReport(filename: string, comment: string): string
  submitReport(filename: string, content: string): void
  isValidFilename(filename: string): boolean
  getStrategicRelDir(): string
}
