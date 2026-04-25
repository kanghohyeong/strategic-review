import { Router } from 'express'
import { ReportServicePort } from '../../../../application/ports/inbound/report.service.port'
import { PromptServicePort } from '../../../../application/ports/inbound/prompt.service.port'
import { WebController } from './web.controller'

export function createWebRouter(reportService: ReportServicePort, promptService: PromptServicePort): Router {
  const router = Router()
  const ctrl = new WebController(reportService, promptService)

  router.get('/', ctrl.listReports)
  router.get('/reports/new', ctrl.newReportForm)
  router.post('/reports', ctrl.createReport)
  router.get('/reports/:filename', ctrl.getReport)
  router.post('/reports/:filename/approve', ctrl.approveReport)
  router.post('/reports/:filename/reject', ctrl.rejectReport)

  return router
}
