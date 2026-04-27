import { Report, ReportGroup } from '../../domain/report/report'
import { Prompt } from '../../domain/prompt/prompt'
import { PromptServicePort } from '../ports/inbound/prompt.service.port'
import { PromptRepositoryPort } from '../ports/outbound/prompt.repository.port'

export class PromptUseCases implements PromptServicePort {
  constructor(private readonly promptRepository: PromptRepositoryPort) { }

  getInitPrompt(file: Report, baseUrl: string): string {
    const patchUrl = `${baseUrl}/api/reports/${file.filename}`
    return new Prompt(this.promptRepository.findTemplate('init')).render({
      objective: file.objective,
      constraintsLine: file.constraints || "없음",
      patchUrl,
    })
  }

  getRevisionPrompt(file: Report, group: ReportGroup, baseUrl: string): string {
    const patchUrl = `${baseUrl}/api/reports/${file.filename}`
    const reviewHistories = group.allFiles
      .filter(f => f.status === 'reject' && f.reviewComment)
      .reverse()
      .map(f => `[v${f.version} 검토 의견]\n${f.reviewComment}`)
      .join('\n\n')
    const lastRejectedFile = group.allFiles.find(f => f.status === 'reject')
    const lastRejectedGetUrl = `${baseUrl}/api/reports/${lastRejectedFile?.filename ?? ''}`
    return new Prompt(this.promptRepository.findTemplate('revision')).render({
      objective: file.objective,
      constraintsLine: file.constraints || "없음",
      reviewHistories,
      lastRejectedGetUrl,
      patchUrl,
    })
  }
}
