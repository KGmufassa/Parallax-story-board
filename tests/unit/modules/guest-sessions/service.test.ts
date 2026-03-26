import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetEnvCache } from "@/config/env"

const { guestSessionRepositoryMock } = vi.hoisted(() => ({
  guestSessionRepositoryMock: {
    create: vi.fn(),
    findById: vi.fn(),
    touch: vi.fn(),
  },
}))

vi.mock("@/modules/guest-sessions/repository", () => ({
  guestSessionRepository: guestSessionRepositoryMock,
}))

import { guestSessionService } from "@/modules/guest-sessions/service"

describe("guestSessionService", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/parallax_story_composer"
    process.env.NEXTAUTH_SECRET = "test-secret"
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.INTERNAL_UPLOAD_TOKEN_SECRET = "test-upload-secret"
    process.env.GUEST_SESSION_TTL_HOURS = "72"
    resetEnvCache()
    vi.clearAllMocks()
  })

  it("issues guest sessions using the configured ttl", async () => {
    guestSessionRepositoryMock.create.mockResolvedValue({ id: "guest-1" })

    await guestSessionService.issue()

    expect(guestSessionRepositoryMock.create).toHaveBeenCalledWith({
      expiresAt: expect.any(Date),
    })
  })

  it("returns null when a guest session id is missing", async () => {
    await expect(guestSessionService.resolve(undefined)).resolves.toBeNull()
    expect(guestSessionRepositoryMock.findById).not.toHaveBeenCalled()
  })

  it("touches and returns an active guest session", async () => {
    const guestSession = {
      id: "guest-1",
      expiresAt: new Date(Date.now() + 60_000),
    }

    guestSessionRepositoryMock.findById.mockResolvedValue(guestSession)

    await expect(guestSessionService.resolve("guest-1")).resolves.toEqual(guestSession)
    expect(guestSessionRepositoryMock.touch).toHaveBeenCalledWith("guest-1")
  })

  it("rejects expired guest sessions", async () => {
    guestSessionRepositoryMock.findById.mockResolvedValue({
      id: "guest-1",
      expiresAt: new Date(Date.now() - 60_000),
    })

    await expect(guestSessionService.resolve("guest-1")).rejects.toThrow(/guest session has expired/i)
    expect(guestSessionRepositoryMock.touch).not.toHaveBeenCalled()
  })
})
