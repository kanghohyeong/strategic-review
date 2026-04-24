import { ReportFile, ReportGroup } from '../../../types'

export interface PromptServicePort {
  getAgentPrompt(file: ReportFile, group: ReportGroup, baseUrl: string): string
}
