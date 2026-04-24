import { initDb, getDb } from '../infrastructure/db'
import { SqliteRepository } from '../adapters/outbound/sqlite/sqlite.repository'

let repo: SqliteRepository

beforeEach(() => {
  initDb(':memory:')
  repo = new SqliteRepository(getDb())
})

function setupReport(prefix = '20991231_235959', version = 1, name = '전략') {
  repo.createGroupIfNotExists(prefix, name, '목표', '제약')
  const filename = `${prefix}.v${version}.md`
  repo.insertReport(filename, prefix, version)
  return filename
}

describe('createGroupIfNotExists', () => {
  it('신규 그룹이면 true를 반환한다', () => {
    const created = repo.createGroupIfNotExists('20991231_235959', '전략', '목표', '제약')
    expect(created).toBe(true)
  })

  it('이미 존재하는 그룹이면 false를 반환한다', () => {
    repo.createGroupIfNotExists('20991231_235959', '전략', '목표', '제약')
    const created = repo.createGroupIfNotExists('20991231_235959', '전략2', '목표2', '제약2')
    expect(created).toBe(false)
  })
})

describe('insertReport', () => {
  it('보고서를 삽입하면 findByFilename으로 조회된다', () => {
    const filename = setupReport()
    const report = repo.findByFilename(filename)
    expect(report.filename).toBe(filename)
    expect(report.status).toBe('init')
    expect(report.version).toBe(1)
    expect(report.content).toBe('')
  })
})

describe('filenameExists', () => {
  it('존재하는 filename이면 true를 반환한다', () => {
    const filename = setupReport()
    expect(repo.filenameExists(filename)).toBe(true)
  })

  it('존재하지 않는 filename이면 false를 반환한다', () => {
    expect(repo.filenameExists('20991231_235959.v1.md')).toBe(false)
  })
})

describe('findByFilename', () => {
  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => repo.findByFilename('20991231_235959.v1.md')).toThrow()
  })

  it('그룹 메타정보(name, objective, constraints)가 함께 반환된다', () => {
    const filename = setupReport('20991231_235959', 1, '전략명')
    const report = repo.findByFilename(filename)
    expect(report.name).toBe('전략명')
    expect(report.objective).toBe('목표')
    expect(report.constraints).toBe('제약')
  })
})

describe('findGroupByPrefix', () => {
  it('prefix로 그룹을 조회할 수 있다', () => {
    const prefix = '20991231_235959'
    setupReport(prefix, 1)
    const group = repo.findGroupByPrefix(prefix)
    expect(group.prefix).toBe(prefix)
    expect(group.allFiles).toHaveLength(1)
    expect(group.latestFile.version).toBe(1)
  })

  it('여러 버전이 있으면 allFiles에 모두 포함된다', () => {
    const prefix = '20991231_235959'
    setupReport(prefix, 1)
    repo.insertReport(`${prefix}.v2.md`, prefix, 2)
    const group = repo.findGroupByPrefix(prefix)
    expect(group.allFiles).toHaveLength(2)
    expect(group.latestFile.version).toBe(2)
  })

  it('존재하지 않는 prefix면 에러를 던진다', () => {
    expect(() => repo.findGroupByPrefix('99991231_999999')).toThrow()
  })
})

describe('getPaginatedGroups', () => {
  it('보고서가 없으면 빈 목록을 반환한다', () => {
    const result = repo.getPaginatedGroups(1)
    expect(result.groups).toHaveLength(0)
    expect(result.totalCount).toBe(0)
    expect(result.totalPages).toBe(1)
    expect(result.currentPage).toBe(1)
  })

  it('보고서를 생성하면 목록에 나타난다', () => {
    setupReport('20991231_235959', 1, '전략A')
    const result = repo.getPaginatedGroups(1)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].latestFile.name).toBe('전략A')
  })

  it('두 버전이 있어도 같은 그룹으로 묶인다', () => {
    const prefix = '20991231_235959'
    setupReport(prefix, 1)
    repo.insertReport(`${prefix}.v2.md`, prefix, 2)
    const result = repo.getPaginatedGroups(1)
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].allFiles).toHaveLength(2)
  })

  it('11개 그룹이면 페이지2에 1개가 있다', () => {
    for (let i = 0; i < 11; i++) {
      const prefix = `2099123${i}_235959`.padEnd(15, '0').slice(0, 15)
      repo.createGroupIfNotExists(prefix, `전략${i}`, '목표', '제약')
      repo.insertReport(`${prefix}.v1.md`, prefix, 1)
    }
    const page1 = repo.getPaginatedGroups(1)
    const page2 = repo.getPaginatedGroups(2)
    expect(page1.groups).toHaveLength(10)
    expect(page2.groups).toHaveLength(1)
    expect(page1.totalPages).toBe(2)
  })
})

describe('updateStatus', () => {
  it('status를 approve로 변경하고 comment를 저장한다', () => {
    const filename = setupReport()
    repo.updateStatus(filename, 'approve', '좋습니다')
    const report = repo.findByFilename(filename)
    expect(report.status).toBe('approve')
    expect(report.reviewComment).toBe('좋습니다')
  })

  it('comment 없이 approve 가능하다', () => {
    const filename = setupReport()
    repo.updateStatus(filename, 'approve')
    expect(repo.findByFilename(filename).reviewComment).toBeUndefined()
  })

  it('status를 reject로 변경할 수 있다', () => {
    const filename = setupReport()
    repo.updateStatus(filename, 'reject', '수정 필요')
    expect(repo.findByFilename(filename).status).toBe('reject')
  })

  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => repo.updateStatus('20991231_235959.v1.md', 'approve')).toThrow()
  })
})

describe('updateContentAndStatus', () => {
  it('content를 저장하고 status를 변경한다', () => {
    const filename = setupReport()
    repo.updateContentAndStatus(filename, '# 본문', 'submit')
    const report = repo.findByFilename(filename)
    expect(report.content).toBe('# 본문')
    expect(report.status).toBe('submit')
  })

  it('존재하지 않는 filename이면 에러를 던진다', () => {
    expect(() => repo.updateContentAndStatus('20991231_235959.v1.md', '내용', 'submit')).toThrow()
  })
})
