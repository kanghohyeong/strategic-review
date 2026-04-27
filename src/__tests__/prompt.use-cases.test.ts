import { PromptUseCases } from '../application/use-cases/prompt.use-cases'
import { Report, ReportGroup, ReportStatus } from '../domain/report/report'
import { MarkdownPromptRepository } from '../adapters/outbound/markdown/markdown-prompt.repository'

const promptUseCases = new PromptUseCases(new MarkdownPromptRepository())
const baseUrl = 'http://localhost:3000'

function makeFile(overrides: Partial<{
  filename: string; prefix: string; version: number; name: string
  objective: string; constraints: string; status: ReportStatus
  content: string; reviewComment?: string
}> = {}): Report {
  return Report.reconstitute({
    filename: '20240101_120000.v1.md',
    prefix: '20240101_120000',
    version: 1,
    name: '전략',
    objective: '수익 극대화',
    constraints: '',
    status: 'init',
    content: '',
    ...overrides,
  })
}

function makeGroup(files: Report[]): ReportGroup {
  return new ReportGroup(files[0].prefix, files)
}

describe('PromptUseCases.getInitPrompt', () => {
  it('제약사항이 있으면 목표·제약사항·PATCH 명령을 포함한 프롬프트를 반환한다', () => {
    const file = makeFile({ constraints: '예산 1억' })
    const prompt = promptUseCases.getInitPrompt(file, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain('제약사항: 예산 1억')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. 현황 개요** |')
  })

  it('제약사항이 없으면 제약사항 없음으로 반환한다', () => {
    const file = makeFile({ constraints: '' })
    const prompt = promptUseCases.getInitPrompt(file, baseUrl)

    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain('제약사항: 없음')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${file.filename}`)
    expect(prompt).toContain('| **1. 현황 개요** |')
  })
})

describe('PromptUseCases.getRevisionPrompt', () => {
  it('이전 버전 검토 의견과 마지막 제출 내용을 포함한 프롬프트를 반환한다', () => {
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
    const prompt = promptUseCases.getRevisionPrompt(revisionFile, group, baseUrl)

    expect(prompt).toContain('[v1 검토 의견]')
    expect(prompt).toContain('논리 보완 필요')
    expect(prompt).toContain(`${baseUrl}/api/reports/20240101_120000.v1.md`)
    expect(prompt).toContain('목표: 수익 극대화')
    expect(prompt).toContain(`PATCH ${baseUrl}/api/reports/${revisionFile.filename}`)
    expect(prompt).toContain('| **1. 현황 개요** |')
  })

  it('여러 버전의 검토 의견이 모두 누적된다', () => {
    const v1 = makeFile({ filename: '20240101_120000.v1.md', version: 1, status: 'reject', reviewComment: '1차 피드백', content: 'v1 내용' })
    const v2 = makeFile({ filename: '20240101_120000.v2.md', version: 2, status: 'reject', reviewComment: '2차 피드백', content: 'v2 내용' })
    const v3 = makeFile({ filename: '20240101_120000.v3.md', version: 3, status: 'revision', reviewComment: '2차 피드백', content: '' })
    const group = makeGroup([v3, v2, v1])
    const prompt = promptUseCases.getRevisionPrompt(v3, group, baseUrl)

    expect(prompt).toContain('[v1 검토 의견]')
    expect(prompt).toContain('1차 피드백')
    expect(prompt).toContain('[v2 검토 의견]')
    expect(prompt).toContain('2차 피드백')
    expect(prompt).toContain(`${baseUrl}/api/reports/20240101_120000.v2.md`)
    expect(prompt).not.toContain(`${baseUrl}/api/reports/20240101_120000.v1.md`)
  })
})
