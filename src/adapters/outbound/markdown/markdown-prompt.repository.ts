import * as fs from 'fs'
import * as path from 'path'
import { PromptRepositoryPort, PromptTemplateName } from '../../../application/ports/outbound/prompt.repository.port'

export class MarkdownPromptRepository implements PromptRepositoryPort {
  private readonly templates = new Map<string, string>()

  constructor(promptsDir = path.resolve(__dirname, '../../../../resources/prompts')) {
    for (const name of ['init', 'revision'] as PromptTemplateName[]) {
      const filePath = path.join(promptsDir, `${name}.md`)
      if (!fs.existsSync(filePath)) throw new Error(`프롬프트 템플릿 파일 누락: ${filePath}`)
      this.templates.set(name, fs.readFileSync(filePath, 'utf-8'))
    }
  }

  findTemplate(name: PromptTemplateName): string {
    const template = this.templates.get(name)
    if (template === undefined) throw new Error(`프롬프트 템플릿 미적재: ${name}`)
    return template
  }
}
