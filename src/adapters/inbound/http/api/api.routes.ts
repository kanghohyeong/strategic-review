import { Router } from 'express'
import { ReportServicePort } from '../../../../domain/ports/report.service.port'
import { ApiController } from './api.controller'

export function createApiRouter(service: ReportServicePort): Router {
  const router = Router()
  const ctrl = new ApiController(service)

  router.get('/api/reports/:filename', ctrl.getReport)
  router.get('/api/groups/:prefix', ctrl.getGroup)
  router.patch('/api/reports/:filename', ctrl.patchReport)

  return router
}
