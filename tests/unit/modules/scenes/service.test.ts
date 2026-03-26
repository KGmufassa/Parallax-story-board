import { JobStatus, SceneStatus } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetEnvCache } from "@/config/env"

const { sceneRepositoryMock } = vi.hoisted(() => ({
  sceneRepositoryMock: {
    countByProjectId: vi.fn(),
    createManyWithAssets: vi.fn(),
    findById: vi.fn(),
    findActiveDecompositionJob: vi.fn(),
    update: vi.fn(),
    updateSceneStatus: vi.fn(),
    createDecompositionJob: vi.fn(),
    updateJob: vi.fn(),
  },
}))

vi.mock("@/modules/scenes/repository", () => ({
  sceneRepository: sceneRepositoryMock,
}))

import { sceneService } from "@/modules/scenes/service"

describe("sceneService", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/parallax_story_composer"
    process.env.NEXTAUTH_SECRET = "test-secret"
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.INTERNAL_UPLOAD_TOKEN_SECRET = "test-upload-secret"
    process.env.GUEST_MAX_SCENES_PER_PROJECT = "10"
    resetEnvCache()
    vi.clearAllMocks()
  })

  it("creates scenes from uploads when project quota allows", async () => {
    sceneRepositoryMock.countByProjectId.mockResolvedValue(1)
    sceneRepositoryMock.createManyWithAssets.mockResolvedValue([{ id: "scene-1" }])

    const result = await sceneService.createFromUploads([
      {
        id: "scene-1",
        projectId: "project-1",
        orderIndex: 0,
        sourceImageUrl: "projects/project-1/incoming/scene-1.png",
        thumbnailUrl: "projects/project-1/scenes/scene-1/v1/thumbnail.webp",
        originalAsset: { assetUrl: "projects/project-1/incoming/scene-1.png" },
        thumbnailAsset: { assetUrl: "projects/project-1/scenes/scene-1/v1/thumbnail.webp" },
      },
    ])

    expect(sceneRepositoryMock.createManyWithAssets).toHaveBeenCalled()
    expect(result).toEqual([{ id: "scene-1" }])
  })

  it("rejects upload batches that exceed the scene quota", async () => {
    sceneRepositoryMock.countByProjectId.mockResolvedValue(10)

    await expect(
      sceneService.createFromUploads([
        {
          id: "scene-1",
          projectId: "project-1",
          orderIndex: 0,
          sourceImageUrl: "projects/project-1/incoming/scene-1.png",
          thumbnailUrl: "projects/project-1/scenes/scene-1/v1/thumbnail.webp",
          originalAsset: { assetUrl: "projects/project-1/incoming/scene-1.png" },
          thumbnailAsset: { assetUrl: "projects/project-1/scenes/scene-1/v1/thumbnail.webp" },
        },
      ]),
    ).rejects.toThrow(/up to 10 scenes/i)
  })

  it("queues decomposition work and marks the scene queued", async () => {
    sceneRepositoryMock.findById.mockResolvedValue({ id: "scene-1", generationVersion: 1 })
    sceneRepositoryMock.findActiveDecompositionJob.mockResolvedValue(null)
    sceneRepositoryMock.createDecompositionJob.mockResolvedValue({ id: "job-1", status: JobStatus.queued })

    const job = await sceneService.enqueueDecomposition("scene-1", {
      correlationId: "corr-1",
      reason: "manual-retry",
      resetGeneration: true,
    })

    expect(sceneRepositoryMock.updateSceneStatus).toHaveBeenCalledWith("scene-1", {
      generationVersion: 2,
      status: SceneStatus.queued,
    })
    expect(job).toEqual({ id: "job-1", status: JobStatus.queued })
  })

  it("saves grouping into framingData while preserving scene fields", async () => {
    sceneRepositoryMock.update.mockResolvedValue({ id: "scene-1" })

    await sceneService.update("scene-1", {
      contextText: "Updated context",
      motionPreset: "Cinematic Push",
      motionIntensity: "high",
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "foreground",
            layerIndexes: [2],
            mobile: {
              startProgress: 0,
              endProgress: 1,
              translateX: 14,
              translateY: -36,
              scaleFrom: 1,
              scaleTo: 1.18,
              opacityFrom: 1,
              opacityTo: 0.95,
              speedMultiplier: 1.3,
              easing: "ease-out",
            },
          },
        ],
      },
    })

    expect(sceneRepositoryMock.update).toHaveBeenCalledWith("scene-1", {
      contextText: "Updated context",
      motionPreset: "Cinematic Push",
      motionIntensity: "high",
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "foreground",
            layerIndexes: [2],
            mobile: {
              startProgress: 0,
              endProgress: 1,
              translateX: 14,
              translateY: -36,
              scaleFrom: 1,
              scaleTo: 1.18,
              opacityFrom: 1,
              opacityTo: 0.95,
              speedMultiplier: 1.3,
              easing: "ease-out",
            },
          },
        ],
      },
    })
  })
})
