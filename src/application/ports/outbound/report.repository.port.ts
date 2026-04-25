import { Report, ReportGroup, PaginatedGroups, ReportStatus } from '../../../domain/report/report'

export interface ReportRepositoryPort {
  findByFilename(filename: string): Report
  findGroupByPrefix(prefix: string): ReportGroup
  getPaginatedGroups(page: number): PaginatedGroups
  createGroupIfNotExists(prefix: string, name: string, objective: string, constraints: string): boolean
  insertReport(prefix: string, version: number): void
  updateStatus(filename: string, status: ReportStatus, comment?: string): void
  updateContentAndStatus(filename: string, content: string, status: ReportStatus): void
  filenameExists(filename: string): boolean
  deleteGroup(prefix: string): void
}
