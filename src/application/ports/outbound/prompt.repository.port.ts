export type PromptTemplateName = 'init' | 'revision'

export interface PromptRepositoryPort {
  findTemplate(name: PromptTemplateName): string
}
