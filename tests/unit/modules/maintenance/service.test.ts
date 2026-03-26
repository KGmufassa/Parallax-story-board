import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetEnvCache } from "@/config/env"

const { projectRepositoryMock, sceneRepositoryMock, sceneServiceMock, metricsMock, logProcessingEventMock } = vi.hoisted(() => ({
  projectRepositoryMock: {
    deleteExpiredGuestProjects: vi.fn(),
    deleteExpiredGuestSessions: vi.fn(),
  },
  sceneRepositoryMock: {
    findTimedOutJobs: vi.fn(),
  },
  sceneServiceMock: {
    markFailed: vi.fn(),
  },
  metricsMock: {
    increment: vi.fn(),
    gauge: vi.fn(),
  },
  logProcessingEventMock: vi.fn(),
}))

vi.mock("@/modules/projects/repository", () => ({
  projectRepository: projectRepositoryMock,
}))

vi.mock("@/modules/scenes/repository", () => ({
  sceneRepository: sceneRepositoryMock,
}))

vi.mock("@/modules/scenes", () => ({
  sceneService: sceneServiceMock,
}))

vi.mock("@/core/observability/metrics", () => ({
  metrics: metricsMock,
}))

vi.mock("@/core/observability/processing-log", () => ({
  logProcessingEvent: logProcessingEventMock,
}))

import { maintenanceService } from "@/modules/maintenance/service"

describe("maintenanceService", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/parallax_story_composer"
    process.env.NEXTAUTH_SECRET = "test-secret"
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.INTERNAL_UPLOAD_TOKEN_SECRET = "test-upload-secret"
    process.env.PROCESSING_JOB_TIMEOUT_MS = "300000"
    resetEnvCache()
    vi.clearAllMocks()
  })

  it("cleans up expired guest projects and sessions", async () => {
    projectRepositoryMock.deleteExpiredGuestProjects.mockResolvedValue({ count: 2 })
    projectRepositoryMock.deleteExpiredGuestSessions.mockResolvedValue({ count: 1 })

    await expect(maintenanceService.cleanupExpiredGuestResources("trace-1")).resolves.toEqual({
      deletedProjects: 2,
      deletedSessions: 1,
    })

    expect(metricsMock.increment).toHaveBeenCalledWith("guest_cleanup_deleted_projects_total", 2)
    expect(metricsMock.increment).toHaveBeenCalledWith("guest_cleanup_deleted_sessions_total", 1)
    expect(logProcessingEventMock).toHaveBeenCalledWith(expect.objectContaining({
      event: "guest cleanup completed",
      traceId: "trace-1",
    }))
  })

  it("marks timed out jobs as failed", async () => {
    sceneRepositoryMock.findTimedOutJobs.mockResolvedValue([
      {
        id: "job-1",
        sceneId: "scene-1",
        attemptCount: 2,
        scene: {
          projectId: "project-1",
        },
      },
    ])

    await expect(maintenanceService.recoverTimedOutJobs("trace-2")).resolves.toEqual({
      recoveredJobs: 1,
    })

    expect(sceneServiceMock.markFailed).toHaveBeenCalledWith(
      "job-1",
      "scene-1",
      "Processing timed out and was recovered by maintenance.",
      3,
    )
    expect(metricsMock.gauge).toHaveBeenCalledWith("processing_queue_depth", 0)
    expect(logProcessingEventMock).toHaveBeenCalledWith(expect.objectContaining({
      event: "timed out job recovered",
      traceId: "trace-2",
      jobId: "job-1",
    }))
  })
})
