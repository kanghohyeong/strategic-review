import { ReportFile } from '../../../types'

export interface PromptServicePort {
  getAgentPrompt(file: ReportFile, baseUrl: string): string
}
