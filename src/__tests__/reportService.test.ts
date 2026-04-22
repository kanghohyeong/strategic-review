import { initDb } from '../db'
import {
  createReport,
  getReportByFilename,
  approveReport,
  rejectReport,
  getPaginatedGroups,
  getGroupByPrefix,
  submitReport,
} from '../reportService'

beforeEach(() => {
  initDb(':memory:')
})

describe('createReport', () => {
  it('filename 형식이 올바르다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    expect(filename).toMatch(/^\d{8}_\d{6}\.v1\.md$/)
  })

  it('생성된 보고서를 filename으로 조회할 수 있다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const report = getReportByFilename(filename)
    expect(report.name).toBe('전략')
    expect(report.objective).toBe('목표')
    expect(report.constraints).toBe('제약')
    expect(report.status).toBe('init')
    expect(report.version).toBe(1)
    expect(report.content).toBe('')
  })

  it('여러 보고서를 생성할 수 있다', () => {
    // prefix 충돌 방지를 위해 ms 단위 차이 허용
    const f1 = createReport({ name: 'A', objective: 'o', constraints: 'c' })
    const f2 = createReport({ name: 'B', objective: 'o', constraints: 'c' })
    expect(f1).not.toBe(f2)
  })
})

describe('getReportByFilename', () => {
  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => getReportByFilename('99991231_235959.v1.md')).toThrow()
  })

  it('형식이 잘못된 filename이면 에러를 던진다', () => {
    expect(() => getReportByFilename('invalid.md')).toThrow('Invalid filename')
  })
})

describe('approveReport', () => {
  it('승인하면 status가 approve로 변경된다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    approveReport(filename, '좋습니다')
    const report = getReportByFilename(filename)
    expect(report.status).toBe('approve')
    expect(report.reviewComment).toBe('좋습니다')
  })

  it('comment 없이 승인할 수 있다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    approveReport(filename)
    const report = getReportByFilename(filename)
    expect(report.status).toBe('approve')
    expect(report.reviewComment).toBeUndefined()
  })

  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => approveReport('99991231_235959.v1.md')).toThrow()
  })
})

describe('rejectReport', () => {
  it('반려하면 기존 보고서의 status가 reject로 변경된다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    rejectReport(filename, '수정 필요')
    const original = getReportByFilename(filename)
    expect(original.status).toBe('reject')
    expect(original.reviewComment).toBe('수정 필요')
  })

  it('반려하면 v+1 새 보고서가 생성되고 revision 상태이다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const newFilename = rejectReport(filename, '수정 필요')
    expect(newFilename).toMatch(/\.v2\.md$/)
    const newReport = getReportByFilename(newFilename)
    expect(newReport.status).toBe('revision')
    expect(newReport.version).toBe(2)
    expect(newReport.name).toBe('전략')
  })

  it('반려 후 또 반려하면 v3가 생성된다', () => {
    const f1 = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const f2 = rejectReport(f1, '1차 반려')
    const f3 = rejectReport(f2, '2차 반려')
    expect(f3).toMatch(/\.v3\.md$/)
  })
})

describe('getPaginatedGroups', () => {
  it('보고서가 없으면 빈 목록을 반환한다', () => {
    const result = getPaginatedGroups(1)
    expect(result.groups).toHaveLength(0)
    expect(result.totalCount).toBe(0)
    expect(result.totalPages).toBe(1)
    expect(result.currentPage).toBe(1)
  })

  it('보고서를 생성하면 목록에 나타난다', () => {
    createReport({ name: '전략A', objective: '목표', constraints: '제약' })
    const result = getPaginatedGroups(1)
    expect(result.groups).toHaveLength(1)
    expect(result.totalCount).toBe(1)
    expect(result.groups[0].latestFile.name).toBe('전략A')
  })

  it('반려 후 새 버전이 생긴 경우 같은 그룹으로 묶인다', () => {
    const f1 = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    rejectReport(f1, '수정 요청')
    const result = getPaginatedGroups(1)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].allFiles).toHaveLength(2)
    expect(result.groups[0].latestFile.version).toBe(2)
  })

  it('10개를 초과하면 페이지네이션이 동작한다', () => {
    for (let i = 0; i < 11; i++) {
      createReport({ name: `전략${i}`, objective: '목표', constraints: '제약' })
    }
    const page1 = getPaginatedGroups(1)
    const page2 = getPaginatedGroups(2)
    expect(page1.groups).toHaveLength(10)
    expect(page2.groups).toHaveLength(1)
    expect(page1.totalPages).toBe(2)
    expect(page1.totalCount).toBe(11)
  })
})

describe('submitReport', () => {
  it('content를 저장하고 status를 submit으로 변경한다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    submitReport(filename, '# 보고서 본문')
    const report = getReportByFilename(filename)
    expect(report.content).toBe('# 보고서 본문')
    expect(report.status).toBe('submit')
  })

  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => submitReport('99991231_235959.v1.md', '내용')).toThrow()
  })

  it('형식이 잘못된 filename이면 에러를 던진다', () => {
    expect(() => submitReport('invalid.md', '내용')).toThrow('Invalid filename')
  })
})

describe('getGroupByPrefix', () => {
  it('prefix로 그룹을 조회할 수 있다', () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const { prefix } = filename.match(/^(?<prefix>\d{8}_\d{6})/)!.groups!
    const group = getGroupByPrefix(prefix)
    expect(group.prefix).toBe(prefix)
    expect(group.allFiles).toHaveLength(1)
    expect(group.latestFile.name).toBe('전략')
  })

  it('존재하지 않는 prefix면 에러를 던진다', () => {
    expect(() => getGroupByPrefix('99991231_999999')).toThrow()
  })
})
