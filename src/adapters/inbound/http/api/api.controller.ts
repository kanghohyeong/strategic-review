import { Request, Response } from 'express'
import { ReportServicePort } from '../../../../application/ports/inbound/report.service.port'
import { toReportDto, toReportGroupDto } from './dto/report.dto'
import { SseNotifier } from './sse.notifier'

export class ApiController {
  constructor(
    private readonly reportService: ReportServicePort,
    private readonly sseNotifier: SseNotifier,
  ) {}

  subscribeEvents = (req: Request, res: Response): void => {
    const { filename } = req.params
    if (!this.reportService.isValidFilename(filename)) {
      res.status(400).end()
      return
    }
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()
    this.sseNotifier.subscribe(filename, res)
    req.on('close', () => {
      this.sseNotifier.unsubscribe(filename, res)
    })
  }

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
      this.sseNotifier.notify(filename)
      res.json(toReportDto(this.reportService.getReportByFilename(filename)))
    } catch {
      res.status(404).json({ error: 'Report not found' })
    }
  }
}
