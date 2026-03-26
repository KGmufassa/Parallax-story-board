import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetEnvCache } from "@/config/env"

const { projectRepositoryMock } = vi.hoisted(() => ({
  projectRepositoryMock: {
    countGuestProjects: vi.fn(),
    createGuestProject: vi.fn(),
    createAuthenticatedProject: vi.fn(),
    findById: vi.fn(),
    claim: vi.fn(),
  },
}))

vi.mock("@/modules/projects/repository", () => ({
  projectRepository: projectRepositoryMock,
}))

import { projectService } from "@/modules/projects/service"

describe("projectService", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/parallax_story_composer"
    process.env.NEXTAUTH_SECRET = "test-secret"
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.INTERNAL_UPLOAD_TOKEN_SECRET = "test-upload-secret"
    process.env.GUEST_MAX_PROJECTS = "3"
    resetEnvCache()
    vi.clearAllMocks()
  })

  it("creates guest projects when quota allows", async () => {
    projectRepositoryMock.countGuestProjects.mockResolvedValue(0)
    projectRepositoryMock.createGuestProject.mockResolvedValue({ id: "project-1", title: "Story" })

    const result = await projectService.create({
      title: "Story",
      actor: {
        kind: "guest",
        guestSessionId: "guest-1",
        expiresAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    })

    expect(projectRepositoryMock.createGuestProject).toHaveBeenCalled()
    expect(result.outputFormat).toBe("9:16")
  })

  it("rejects guest project creation when quota is exceeded", async () => {
    projectRepositoryMock.countGuestProjects.mockResolvedValue(3)

    await expect(
      projectService.create({
        title: "Story",
        actor: {
          kind: "guest",
          guestSessionId: "guest-1",
          expiresAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      }),
    ).rejects.toThrow(/only keep 3 active projects/i)
  })

  it("claims an unclaimed guest project for an authenticated user", async () => {
    projectRepositoryMock.findById.mockResolvedValue({
      id: "project-1",
      guestSessionId: "guest-1",
      ownerId: null,
      claimedAt: null,
      expiresAt: null,
    })
    projectRepositoryMock.claim.mockResolvedValue({ id: "project-1", ownerId: "user-1" })

    const result = await projectService.claim("project-1", {
      userId: "user-1",
      guestSessionId: "guest-1",
    })

    expect(projectRepositoryMock.claim).toHaveBeenCalledWith("project-1", {
      userId: "user-1",
      guestSessionId: "guest-1",
    })
    expect(result.ownerId).toBe("user-1")
  })
})
