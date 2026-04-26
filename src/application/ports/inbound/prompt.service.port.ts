import { Report, ReportGroup } from '../../../domain/report/report'

export interface PromptServicePort {
  getInitPrompt(file: Report, baseUrl: string): string
  getRevisionPrompt(file: Report, group: ReportGroup, baseUrl: string): string
}
