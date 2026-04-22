export type ReportStatus = 'init' | 'submit' | 'approve' | 'reject' | 'revision'

export interface ReportFile {
  filename: string
  prefix: string
  version: number
  name: string
  objective: string
  constraints: string
  status: ReportStatus
  reviewComment?: string
  content: string
}

export interface ReportGroup {
  prefix: string
  latestFile: ReportFile
  allFiles: ReportFile[]
}

export interface PaginatedGroups {
  groups: ReportGroup[]
  currentPage: number
  totalPages: number
  totalCount: number
}
