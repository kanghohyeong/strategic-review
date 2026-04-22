import { Router, Request, Response } from 'express'
import { marked } from 'marked'
import {
  getPaginatedGroups,
  getReportByFilename,
  getGroupByPrefix,
  createReport,
  approveReport,
  rejectReport,
  getStrategicRelDir,
} from './reportService'

export const router = Router()

function handleError(res: Response, err: unknown): void {
  if (err instanceof Error) {
    if (err.message === 'Invalid filename' || err.message.startsWith('ENOENT')) {
      res.status(404).render('error', { message: 'Report not found.', code: 404 })
    } else if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).render('error', { message: 'Report not found.', code: 404 })
    } else {
      console.error(err)
      res.status(500).render('error', { message: 'Internal server error.', code: 500 })
    }
  } else {
    console.error(err)
    res.status(500).render('error', { message: 'Internal server error.', code: 500 })
  }
}

// GET / — 목록 (10건/페이지, 최신순)
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page ?? '1'), 10) || 1
    const data = getPaginatedGroups(page)
    res.render('list', data)
  } catch (err) {
    handleError(res, err)
  }
})

// GET /reports/new — 등록 폼
router.get('/reports/new', (_req: Request, res: Response) => {
  res.render('new', { error: undefined })
})

// POST /reports — 보고서 생성
router.post('/reports', (req: Request, res: Response) => {
  try {
    const name = String(req.body.name ?? '').trim()
    const objective = String(req.body.objective ?? '').trim()
    const constraints = String(req.body.constraints ?? '').trim()

    if (!name) {
      res.render('new', { error: 'Report name is required.' })
      return
    }
    if (!objective) {
      res.render('new', { error: 'Objective is required.' })
      return
    }

    const filename = createReport({ name, objective, constraints })
    res.redirect(`/reports/${filename}`)
  } catch (err) {
    handleError(res, err)
  }
})

// GET /reports/:filename — 상세
router.get('/reports/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const file = getReportByFilename(filename)
    const group = getGroupByPrefix(file.prefix)
    const renderedContent = file.content
      ? String(await marked.parse(file.content))
      : '<p style="color:#888">No content available.</p>'
    res.render('detail', { file, group, renderedContent, strategicDir: getStrategicRelDir() })
  } catch (err) {
    handleError(res, err)
  }
})

// POST /reports/:filename/approve — 승인
router.post('/reports/:filename/approve', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const comment = String(req.body.comment ?? '').trim()

    if (!comment) {
      const file = getReportByFilename(filename)
      const group = getGroupByPrefix(file.prefix)
      const renderedContent = file.content
        ? String(await marked.parse(file.content))
        : '<p style="color:#888">No content available.</p>'
      res.render('detail', { file, group, renderedContent, strategicDir: getStrategicRelDir() })
      return
    }

    approveReport(filename, comment)
    res.redirect(`/reports/${filename}`)
  } catch (err) {
    handleError(res, err)
  }
})

// POST /reports/:filename/reject — 반려
router.post('/reports/:filename/reject', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params
    const comment = String(req.body.comment ?? '').trim()

    if (!comment) {
      const file = getReportByFilename(filename)
      const group = getGroupByPrefix(file.prefix)
      const renderedContent = file.content
        ? String(await marked.parse(file.content))
        : '<p style="color:#888">No content available.</p>'
      res.render('detail', { file, group, renderedContent, strategicDir: getStrategicRelDir() })
      return
    }

    const newFilename = rejectReport(filename, comment)
    res.redirect(`/reports/${newFilename}`)
  } catch (err) {
    handleError(res, err)
  }
})
