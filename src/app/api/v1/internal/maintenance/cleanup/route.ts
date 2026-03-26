import { defineRoute } from "@/core/http/route-handler"
import { ensureInternalMaintenanceAccess } from "@/interfaces/http/support/internal-maintenance"
import { maintenanceController } from "@/interfaces/http/controllers/maintenance-controller"

export const POST = defineRoute(async (request, context) => {
  ensureInternalMaintenanceAccess(request)
  return maintenanceController.cleanup(context)
})
