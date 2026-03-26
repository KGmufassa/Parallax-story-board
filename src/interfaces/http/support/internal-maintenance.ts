import { timingSafeEqual } from "node:crypto"

import { getEnv } from "@/config/env"
import { AppError } from "@/core/errors/app-error"

export function ensureInternalMaintenanceAccess(request: Request) {
  const env = getEnv()

  if (!env.INTERNAL_MAINTENANCE_TOKEN) {
    throw new AppError({
      code: "MAINTENANCE_DISABLED",
      message: "Internal maintenance token is not configured.",
      statusCode: 503,
    })
  }

  const providedToken = request.headers.get("x-internal-maintenance-token")

  if (!providedToken || providedToken.length !== env.INTERNAL_MAINTENANCE_TOKEN.length) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Internal maintenance token is required.",
      statusCode: 403,
    })
  }

  if (!timingSafeEqual(Buffer.from(providedToken), Buffer.from(env.INTERNAL_MAINTENANCE_TOKEN))) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Internal maintenance token is required.",
      statusCode: 403,
    })
  }
}
