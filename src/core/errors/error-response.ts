import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

import { isAppError } from "@/core/errors/app-error"
import type { RequestContext } from "@/core/request/context"

export function toErrorResponse(error: unknown, context: RequestContext) {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        meta: {
          correlationId: context.correlationId,
        },
      },
      { status: error.statusCode },
    )
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "The database is unavailable right now.",
          details: null,
        },
        meta: {
          correlationId: context.correlationId,
        },
      },
      { status: 503 },
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.flatten(),
        },
        meta: {
          correlationId: context.correlationId,
        },
      },
      { status: 400 },
    )
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
        details: null,
      },
      meta: {
        correlationId: context.correlationId,
      },
    },
    { status: 500 },
  )
}
