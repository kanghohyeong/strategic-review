import request from 'supertest'
import express from 'express'
import { router } from '../routes'
import { initDb } from '../db'
import { createReport, rejectReport } from '../reportService'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.text({ type: ['text/plain', 'text/markdown'] }))
app.use('/', router)

beforeEach(() => {
  initDb(':memory:')
})

describe('GET /api/reports/:filename', () => {
  it('보고서 JSON을 반환한다', async () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const res = await request(app).get(`/api/reports/${filename}`)
    expect(res.status).toBe(200)
    expect(res.body.filename).toBe(filename)
    expect(res.body.name).toBe('전략')
    expect(res.body.status).toBe('init')
  })

  it('존재하지 않는 filename이면 404를 반환한다', async () => {
    const res = await request(app).get('/api/reports/99991231_235959.v1.md')
    expect(res.status).toBe(404)
  })

  it('형식이 잘못된 filename이면 400을 반환한다', async () => {
    const res = await request(app).get('/api/reports/invalid.md')
    expect(res.status).toBe(400)
  })
})

describe('GET /api/groups/:prefix', () => {
  it('prefix로 그룹 JSON을 반환한다', async () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const prefix = filename.replace(/\.v\d+\.md$/, '')
    const res = await request(app).get(`/api/groups/${prefix}`)
    expect(res.status).toBe(200)
    expect(res.body.prefix).toBe(prefix)
    expect(res.body.allFiles).toHaveLength(1)
  })

  it('반려 후 여러 버전이 포함된다', async () => {
    const f1 = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const prefix = f1.replace(/\.v\d+\.md$/, '')
    rejectReport(f1, '수정 필요')
    const res = await request(app).get(`/api/groups/${prefix}`)
    expect(res.status).toBe(200)
    expect(res.body.allFiles).toHaveLength(2)
    expect(res.body.latestFile.version).toBe(2)
  })

  it('존재하지 않는 prefix면 404를 반환한다', async () => {
    const res = await request(app).get('/api/groups/99991231_999999')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/reports/:filename', () => {
  it('content를 업데이트하고 status를 submit으로 변경한다', async () => {
    const filename = createReport({ name: '전략', objective: '목표', constraints: '제약' })
    const res = await request(app)
      .patch(`/api/reports/${filename}`)
      .type('text/markdown')
      .send('# 보고서 본문')
    expect(res.status).toBe(200)
    expect(res.body.content).toBe('# 보고서 본문')
    expect(res.body.status).toBe('submit')
  })

  it('존재하지 않는 filename이면 404를 반환한다', async () => {
    const res = await request(app)
      .patch('/api/reports/99991231_235959.v1.md')
      .type('text/markdown')
      .send('내용')
    expect(res.status).toBe(404)
  })

  it('형식이 잘못된 filename이면 400을 반환한다', async () => {
    const res = await request(app)
      .patch('/api/reports/invalid.md')
      .type('text/markdown')
      .send('내용')
    expect(res.status).toBe(400)
  })
})
