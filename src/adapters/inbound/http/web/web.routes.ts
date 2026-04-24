import { Router } from 'express'
import { ReportServicePort } from '../../../../domain/ports/report.service.port'
import { WebController } from './web.controller'

export function createWebRouter(service: ReportServicePort): Router {
  const router = Router()
  const ctrl = new WebController(service)

  router.get('/', ctrl.listReports)
  router.get('/reports/new', ctrl.newReportForm)
  router.post('/reports', ctrl.createReport)
  router.get('/reports/:filename', ctrl.getReport)
  router.post('/reports/:filename/approve', ctrl.approveReport)
  router.post('/reports/:filename/reject', ctrl.rejectReport)

  return router
}
