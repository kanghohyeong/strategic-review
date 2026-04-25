import { Report, ReportGroup } from '../../../domain/report/report'

export interface PromptServicePort {
  getAgentPrompt(file: Report, group: ReportGroup, baseUrl: string): string
}
