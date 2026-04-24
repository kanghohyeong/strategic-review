import { Request, Response } from 'express'
import { ReportServicePort } from '../../../../domain/ports/report.service.port'

export class ApiController {
  constructor(private readonly service: ReportServicePort) {}

  getReport = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.service.isValidFilename(filename)) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }
    try {
      res.json(this.service.getReportByFilename(filename))
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }

  getGroup = (req: Request, res: Response): void => {
    try {
      res.json(this.service.getGroupByPrefix(req.params.prefix))
    } catch {
      res.status(404).json({ error: 'Group not found' })
    }
  }

  patchReport = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.service.isValidFilename(filename)) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }
    const content = typeof req.body === 'string' ? req.body : ''
    try {
      this.service.submitReport(filename, content)
      res.json(this.service.getReportByFilename(filename))
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }
}
