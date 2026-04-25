import { ReportFile, ReportGroup } from '../../../domain/report/report'

export interface PromptServicePort {
  getAgentPrompt(file: ReportFile, group: ReportGroup, baseUrl: string): string
}
