import { AuthProvider } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { authRepositoryMock } = vi.hoisted(() => ({
  authRepositoryMock: {
    findByEmail: vi.fn(),
    createUser: vi.fn(),
  },
}))

vi.mock("@/modules/auth/repository", () => ({
  authRepository: authRepositoryMock,
}))

import { authService } from "@/modules/auth/service"

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("registers credentials users with a hashed password", async () => {
    authRepositoryMock.findByEmail.mockResolvedValue(null)
    authRepositoryMock.createUser.mockResolvedValue({
      id: "user-1",
      email: "creator@example.com",
      authProvider: AuthProvider.credentials,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    })

    const result = await authService.register({
      email: "creator@example.com",
      password: "super-secret-password",
    })

    expect(authRepositoryMock.createUser).toHaveBeenCalledWith({
      email: "creator@example.com",
      authProvider: AuthProvider.credentials,
      passwordHash: expect.any(String),
    })
    expect(authRepositoryMock.createUser.mock.calls[0]?.[0]?.passwordHash).not.toBe("super-secret-password")
    expect(result).toMatchObject({
      id: "user-1",
      email: "creator@example.com",
      authProvider: AuthProvider.credentials,
    })
  })

  it("rejects duplicate registration attempts", async () => {
    authRepositoryMock.findByEmail.mockResolvedValue({ id: "user-1" })

    await expect(
      authService.register({
        email: "creator@example.com",
        password: "super-secret-password",
      }),
    ).rejects.toThrow(/already exists/i)

    expect(authRepositoryMock.createUser).not.toHaveBeenCalled()
  })
})
