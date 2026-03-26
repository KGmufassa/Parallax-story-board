import { Prisma } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { ZodError } from "zod"

import { AppError } from "@/core/errors/app-error"
import { toErrorResponse } from "@/core/errors/error-response"

const context = {
  correlationId: "test-correlation-id",
  path: "/api/test",
  method: "POST",
} as const

describe("toErrorResponse", () => {
  it("maps prisma initialization failures to a database unavailable response", async () => {
    const error = new Prisma.PrismaClientInitializationError("db down", "test")

    const response = toErrorResponse(error, context)
    const payload = await response.json()

    expect(response.status).toBe(503)
    expect(payload).toEqual({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is unavailable right now.",
        details: null,
      },
      meta: {
        correlationId: "test-correlation-id",
      },
    })
  })

  it("preserves app errors", async () => {
    const response = toErrorResponse(
      new AppError({
        code: "TEST_ERROR",
        message: "Known issue",
        statusCode: 418,
      }),
      context,
    )

    const payload = await response.json()

    expect(response.status).toBe(418)
    expect(payload.error.code).toBe("TEST_ERROR")
    expect(payload.error.message).toBe("Known issue")
  })

  it("maps zod errors to validation errors", async () => {
    const error = new ZodError([])

    const response = toErrorResponse(error, context)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe("VALIDATION_ERROR")
  })
})
