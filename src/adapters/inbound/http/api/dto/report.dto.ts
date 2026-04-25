import { Report, ReportGroup } from '../../../../../domain/report/report'

export interface ReportDto {
  filename: string
  prefix: string
  version: number
  name: string
  objective: string
  constraints: string
  status: string
  reviewComment?: string
  content: string
}

export interface ReportGroupDto {
  prefix: string
  latestFile: ReportDto
  allFiles: ReportDto[]
}

export function toReportDto(report: Report): ReportDto {
  return {
    filename: report.filename,
    prefix: report.prefix,
    version: report.version,
    name: report.name,
    objective: report.objective,
    constraints: report.constraints,
    status: report.status,
    reviewComment: report.reviewComment,
    content: report.content,
  }
}

export function toReportGroupDto(group: ReportGroup): ReportGroupDto {
  const allFiles = group.allFiles.map(toReportDto)
  return {
    prefix: group.prefix,
    latestFile: allFiles[0],
    allFiles,
  }
}
