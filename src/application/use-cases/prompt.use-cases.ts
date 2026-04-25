import { Report, ReportGroup } from '../../domain/report/report'
import { Prompt } from '../../domain/prompt/prompt'
import { PromptServicePort } from '../ports/inbound/prompt.service.port'

export class PromptUseCases implements PromptServicePort {
  getAgentPrompt(file: Report, group: ReportGroup, baseUrl: string): string {
    const patchUrl = `${baseUrl}/api/reports/${file.filename}`
    return Prompt.from(file, group, patchUrl).toString()
  }
}
