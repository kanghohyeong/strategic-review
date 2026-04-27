import { Router } from 'express'
import { ReportServicePort } from '../../../../application/ports/inbound/report.service.port'
import { ApiController } from './api.controller'
import { SseNotifier } from './sse.notifier'

export function createApiRouter(reportService: ReportServicePort, sseNotifier: SseNotifier): Router {
  const router = Router()
  const ctrl = new ApiController(reportService, sseNotifier)

  router.get('/api/reports/:filename', ctrl.getReport)
  router.get('/api/reports/:filename/events', ctrl.subscribeEvents)
  router.get('/api/groups/:prefix', ctrl.getGroup)
  router.patch('/api/reports/:filename', ctrl.patchReport)
  router.delete('/api/reports/:filename', ctrl.deleteReport)

  return router
}
