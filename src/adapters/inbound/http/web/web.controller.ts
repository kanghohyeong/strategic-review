import { Request, Response } from 'express'
import { marked } from 'marked'
import { ReportServicePort } from '../../../../domain/ports/report.service.port'

export class WebController {
  constructor(private readonly service: ReportServicePort) {}

  private handleError(res: Response, err: unknown): void {
    if (err instanceof Error) {
      if (err.message === 'Invalid filename' || err.message.startsWith('Report not found') || err.message.startsWith('No files found')) {
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

  listReports = (req: Request, res: Response): void => {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10) || 1
      const data = this.service.getPaginatedGroups(page)
      res.render('list', data)
    } catch (err) {
      this.handleError(res, err)
    }
  }

  newReportForm = (_req: Request, res: Response): void => {
    res.render('new', { error: undefined })
  }

  createReport = (req: Request, res: Response): void => {
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

      const filename = this.service.createReport({ name, objective, constraints })
      res.redirect(`/reports/${filename}`)
    } catch (err) {
      this.handleError(res, err)
    }
  }

  getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params
      const file = this.service.getReportByFilename(filename)
      const group = this.service.getGroupByPrefix(file.prefix)
      const renderedContent = file.content
        ? String(await marked.parse(file.content))
        : '<p style="color:#888">No content available.</p>'
      res.render('detail', { file, group, renderedContent, strategicDir: this.service.getStrategicRelDir() })
    } catch (err) {
      this.handleError(res, err)
    }
  }

  approveReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params
      const comment = String(req.body.comment ?? '').trim()

      if (!comment) {
        const file = this.service.getReportByFilename(filename)
        const group = this.service.getGroupByPrefix(file.prefix)
        const renderedContent = file.content
          ? String(await marked.parse(file.content))
          : '<p style="color:#888">No content available.</p>'
        res.render('detail', { file, group, renderedContent, strategicDir: this.service.getStrategicRelDir() })
        return
      }

      this.service.approveReport(filename, comment)
      res.redirect(`/reports/${filename}`)
    } catch (err) {
      this.handleError(res, err)
    }
  }

  rejectReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params
      const comment = String(req.body.comment ?? '').trim()

      if (!comment) {
        const file = this.service.getReportByFilename(filename)
        const group = this.service.getGroupByPrefix(file.prefix)
        const renderedContent = file.content
          ? String(await marked.parse(file.content))
          : '<p style="color:#888">No content available.</p>'
        res.render('detail', { file, group, renderedContent, strategicDir: this.service.getStrategicRelDir() })
        return
      }

      const newFilename = this.service.rejectReport(filename, comment)
      res.redirect(`/reports/${newFilename}`)
    } catch (err) {
      this.handleError(res, err)
    }
  }
}
