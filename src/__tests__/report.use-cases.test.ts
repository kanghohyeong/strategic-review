import { initDb, getDb } from '../infrastructure/db'
import { SqliteRepository } from '../adapters/outbound/sqlite/sqlite.repository'
import { ReportUseCases } from '../application/use-cases/report.use-cases'

let useCases: ReportUseCases

beforeEach(() => {
  initDb(':memory:')
  useCases = new ReportUseCases(new SqliteRepository(getDb()))
})

describe('createReport', () => {
  it('filename 형식이 올바르다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    expect(filename).toMatch(/^\d{8}_\d{6}\.v1\.md$/)
  })

  it('생성된 보고서를 filename으로 조회할 수 있다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const report = useCases.getReportByFilename(filename)
    expect(report.name).toBe('전략')
    expect(report.objective).toBe('목표')
    expect(report.constraints).toBe('제약')
    expect(report.status).toBe('init')
    expect(report.version).toBe(1)
    expect(report.content).toBe('')
  })

  it('여러 보고서를 생성하면 서로 다른 filename이 부여된다', () => {
    const f1 = useCases.createReport({ name: 'A', objective: 'o', constraints: 'c' })
    const f2 = useCases.createReport({ name: 'B', objective: 'o', constraints: 'c' })
    expect(f1).not.toBe(f2)
  })
})

describe('getReportByFilename', () => {
  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => useCases.getReportByFilename('99991231_235959.v1.md')).toThrow()
  })

  it('형식이 잘못된 filename이면 에러를 던진다', () => {
    expect(() => useCases.getReportByFilename('invalid.md')).toThrow('Invalid filename')
  })
})

describe('approveReport', () => {
  it('승인하면 status가 approve로 변경된다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.approveReport(filename, '좋습니다')
    expect(useCases.getReportByFilename(filename).status).toBe('approve')
    expect(useCases.getReportByFilename(filename).reviewComment).toBe('좋습니다')
  })

  it('comment 없이 승인할 수 있다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.approveReport(filename)
    expect(useCases.getReportByFilename(filename).reviewComment).toBeUndefined()
  })
})

describe('rejectReport', () => {
  it('반려하면 기존 보고서 status가 reject로 변경된다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.rejectReport(filename, '수정 필요')
    expect(useCases.getReportByFilename(filename).status).toBe('reject')
    expect(useCases.getReportByFilename(filename).reviewComment).toBe('수정 필요')
  })

  it('반려하면 v+1 새 보고서가 생성되고 revision 상태이다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const newFilename = useCases.rejectReport(filename, '수정 필요')
    expect(newFilename).toMatch(/\.v2\.md$/)
    const newReport = useCases.getReportByFilename(newFilename)
    expect(newReport.status).toBe('revision')
    expect(newReport.version).toBe(2)
    expect(newReport.name).toBe('전략')
  })

  it('반려 후 또 반려하면 v3가 생성된다', () => {
    const f1 = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const f2 = useCases.rejectReport(f1, '1차 반려')
    const f3 = useCases.rejectReport(f2, '2차 반려')
    expect(f3).toMatch(/\.v3\.md$/)
  })
})

describe('submitReport', () => {
  it('content를 저장하고 status를 submit으로 변경한다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.submitReport(filename, '# 보고서 본문')
    const report = useCases.getReportByFilename(filename)
    expect(report.content).toBe('# 보고서 본문')
    expect(report.status).toBe('submit')
  })

  it('형식이 잘못된 filename이면 에러를 던진다', () => {
    expect(() => useCases.submitReport('invalid.md', '내용')).toThrow('Invalid filename')
  })
})

describe('getPaginatedGroups', () => {
  it('보고서가 없으면 빈 목록을 반환한다', () => {
    const result = useCases.getPaginatedGroups(1)
    expect(result.groups).toHaveLength(0)
    expect(result.totalCount).toBe(0)
  })

  it('반려 후 새 버전이 생긴 경우 같은 그룹으로 묶인다', () => {
    const f1 = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.rejectReport(f1, '수정 요청')
    const result = useCases.getPaginatedGroups(1)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].allFiles).toHaveLength(2)
    expect(result.groups[0].latestFile.version).toBe(2)
  })
})

describe('getGroupByPrefix', () => {
  it('prefix로 그룹을 조회할 수 있다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const { prefix } = filename.match(/^(?<prefix>\d{8}_\d{6})/)!.groups!
    const group = useCases.getGroupByPrefix(prefix)
    expect(group.prefix).toBe(prefix)
    expect(group.latestFile.name).toBe('전략')
  })
})

describe('deleteReport', () => {
  it('삭제 후 해당 filename 조회 시 에러를 던진다', () => {
    const filename = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    useCases.deleteReport(filename)
    expect(() => useCases.getReportByFilename(filename)).toThrow()
  })

  it('삭제 후 그룹의 다른 버전도 모두 삭제된다', () => {
    const f1 = useCases.createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const f2 = useCases.rejectReport(f1, '수정 필요')
    useCases.deleteReport(f2)
    expect(() => useCases.getReportByFilename(f1)).toThrow()
    expect(() => useCases.getReportByFilename(f2)).toThrow()
  })

  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => useCases.deleteReport('99991231_235959.v1.md')).toThrow()
  })

  it('형식이 잘못된 filename이면 에러를 던진다', () => {
    expect(() => useCases.deleteReport('invalid.md')).toThrow('Invalid filename')
  })
})

describe('isValidFilename', () => {
  it('올바른 형식은 true를 반환한다', () => {
    expect(useCases.isValidFilename('20991231_235959.v1.md')).toBe(true)
  })

  it('잘못된 형식은 false를 반환한다', () => {
    expect(useCases.isValidFilename('invalid.md')).toBe(false)
  })
})

