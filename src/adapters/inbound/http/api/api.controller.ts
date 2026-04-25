import { Request, Response } from 'express'
import { ReportServicePort } from '../../../../application/ports/inbound/report.service.port'
import { toReportDto, toReportGroupDto } from './dto/report.dto'

export class ApiController {
  constructor(private readonly reportService: ReportServicePort) {}

  getReport = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.reportService.isValidFilename(filename)) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }
    try {
      res.json(toReportDto(this.reportService.getReportByFilename(filename)))
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }

  getGroup = (req: Request, res: Response): void => {
    try {
      res.json(toReportGroupDto(this.reportService.getGroupByPrefix(req.params.prefix)))
    } catch {
      res.status(404).json({ error: 'Group not found' })
    }
  }

  deleteReport = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.reportService.isValidFilename(filename)) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }
    try {
      this.reportService.deleteReport(filename)
      res.status(204).send()
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }

  patchReport = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.reportService.isValidFilename(filename)) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }
    const content = typeof req.body === 'string' ? req.body : ''
    try {
      this.reportService.submitReport(filename, content)
      res.json(toReportDto(this.reportService.getReportByFilename(filename)))
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }
}
