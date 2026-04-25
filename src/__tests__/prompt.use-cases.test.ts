import { PromptUseCases } from '../application/use-cases/prompt.use-cases'
import { ReportFile, ReportGroup } from '../domain/report/report'

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

function makeGroup(files: ReportFile[]): ReportGroup {
  return {
    prefix: files[0].prefix,
    latestFile: files[0],
    allFiles: files,
  }
}

describe('PromptUseCases.getAgentPrompt', () => {
  it('init 상태이고 제약사항이 있으면 목표·제약사항·PATCH 명령을 포함한 프롬프트를 반환한다', () => {
    const file = makeFile({ constraints: '예산 1억' })
    const group = makeGroup([file])
    const prompt = promptUseCases.getAgentPrompt(file, group, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain('제약사항: 예산 1억')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('init 상태이고 제약사항이 없으면 제약사항 줄을 포함하지 않는다', () => {
    const file = makeFile({ constraints: '' })
    const group = makeGroup([file])
    const prompt = promptUseCases.getAgentPrompt(file, group, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).not.toContain('제약사항:')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('revision 상태이면 이전 버전 검토 의견과 마지막 제출 내용을 포함한 프롬프트를 반환한다', () => {
    const rejectedFile = makeFile({
      filename: '20240101_120000.v1.md',
      version: 1,
      status: 'reject',
      reviewComment: '논리 보완 필요',
      content: '# 이전 보고서 내용',
    })
    const revisionFile = makeFile({
      filename: '20240101_120000.v2.md',
      version: 2,
      status: 'revision',
      reviewComment: '논리 보완 필요',
      content: '',
    })
    const group = makeGroup([revisionFile, rejectedFile])
    const prompt = promptUseCases.getAgentPrompt(revisionFile, group, baseUrl)

    expect(prompt).toContain('[v1 검토 의견]')
    expect(prompt).toContain('논리 보완 필요')
    expect(prompt).toContain('# 이전 보고서 내용')
    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${revisionFile.filename}`)
    expect(prompt).toContain('| **1. Current Overview** |')
  })

  it('revision 상태에서 여러 버전의 검토 의견이 모두 누적된다', () => {
    const v1 = makeFile({ filename: '20240101_120000.v1.md', version: 1, status: 'reject', reviewComment: '1차 피드백', content: 'v1 내용' })
    const v2 = makeFile({ filename: '20240101_120000.v2.md', version: 2, status: 'reject', reviewComment: '2차 피드백', content: 'v2 내용' })
    const v3 = makeFile({ filename: '20240101_120000.v3.md', version: 3, status: 'revision', reviewComment: '2차 피드백', content: '' })
    const group = makeGroup([v3, v2, v1])
    const prompt = promptUseCases.getAgentPrompt(v3, group, baseUrl)

    expect(prompt).toContain('[v1 검토 의견]')
    expect(prompt).toContain('1차 피드백')
    expect(prompt).toContain('[v2 검토 의견]')
    expect(prompt).toContain('2차 피드백')
    expect(prompt).toContain('v2 내용')
    expect(prompt).not.toContain('v1 내용')
  })

  it('submit 상태이면 빈 문자열을 반환한다', () => {
    const file = makeFile({ status: 'submit' })
    const group = makeGroup([file])
    expect(promptUseCases.getAgentPrompt(file, group, baseUrl)).toBe('')
  })

  it('approve 상태이면 빈 문자열을 반환한다', () => {
    const file = makeFile({ status: 'approve' })
    const group = makeGroup([file])
    expect(promptUseCases.getAgentPrompt(file, group, baseUrl)).toBe('')
  })
})
