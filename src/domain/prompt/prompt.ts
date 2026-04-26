export class Prompt {
  constructor(private readonly template: string) {}

  render(variables: Record<string, string>): string {
    return this.template.replace(/#\{([^}]+)\}/g, (_, key) => {
      if (!(key in variables)) throw new Error(`정의되지 않은 템플릿 변수: #{${key}}`)
      return variables[key]
    })
  }
}
