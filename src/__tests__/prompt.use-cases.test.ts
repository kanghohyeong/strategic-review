import { PromptUseCases } from '../domain/prompt/prompt.use-cases'
import { ReportFile } from '../types'

const promptUseCases = new PromptUseCases()
const baseUrl = 'http://localhost:3000'

function makeFile(overrides: Partial<ReportFile> = {}): ReportFile {
  return {
    filename: '20240101_120000.v1.md',
    prefix: '20240101_120000',
    version: 1,
    name: '전략',
    objective: '수익 극대화',
    constraints: '',
    status: 'init',
    content: '',
    ...overrides,
  }
}

describe('PromptUseCases.getAgentPrompt', () => {
  it('init 상태이고 제약사항이 있으면 목표·제약사항·PATCH 명령을 포함한 프롬프트를 반환한다', () => {
    const file = makeFile({ constraints: '예산 1억' })
    const prompt = promptUseCases.getAgentPrompt(file, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain('제약사항: 예산 1억')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('init 상태이고 제약사항이 없으면 제약사항 줄을 포함하지 않는다', () => {
    const file = makeFile({ constraints: '' })
    const prompt = promptUseCases.getAgentPrompt(file, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).not.toContain('제약사항:')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('revision 상태이면 리뷰 코멘트·PATCH 명령을 포함한 프롬프트를 반환한다', () => {
    const file = makeFile({ status: 'revision', reviewComment: '논리 보완 필요' })
    const prompt = promptUseCases.getAgentPrompt(file, baseUrl)

    expect(prompt).toContain('리뷰 코멘트: 논리 보완 필요')
    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('submit 상태이면 빈 문자열을 반환한다', () => {
    const file = makeFile({ status: 'submit' })
    expect(promptUseCases.getAgentPrompt(file, baseUrl)).toBe('')
  })

  it('approve 상태이면 빈 문자열을 반환한다', () => {
    const file = makeFile({ status: 'approve' })
    expect(promptUseCases.getAgentPrompt(file, baseUrl)).toBe('')
  })
})
