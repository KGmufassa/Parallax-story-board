import { JobStatus, Prisma, SceneStatus } from "@prisma/client"

import { getEnv } from "@/config/env"
import { AppError } from "@/core/errors/app-error"
import { sceneRepository } from "@/modules/scenes/repository"
import type { UpdateSceneInput } from "@/modules/scenes/types"

export const sceneService = {
  async getById(sceneId: string) {
    const scene = await sceneRepository.findById(sceneId)

    if (!scene) {
      throw new AppError({
        code: "SCENE_NOT_FOUND",
        message: "Scene was not found.",
        statusCode: 404,
      })
    }

    return scene
  },

  async nextOrderIndex(projectId: string) {
    return sceneRepository.nextOrderIndex(projectId)
  },

  async createFromUploads(items: Array<{
    id: string
    projectId: string
    orderIndex: number
    generationVersion?: number
    sourceImageUrl: string
    thumbnailUrl: string
    contextText?: string | null
    motionPreset?: string | null
    motionIntensity?: string | null
    expiresAt?: Date | null
    originalAsset: { assetUrl: string; width?: number; height?: number; metadataJson?: Prisma.InputJsonValue }
    thumbnailAsset: { assetUrl: string; width?: number; height?: number; metadataJson?: Prisma.InputJsonValue }
  }>) {
    if (items.length === 0) {
      return []
    }

    const env = getEnv()
    const projectId = items[0]?.projectId
    const existingCount = await sceneRepository.countByProjectId(projectId)

    if (existingCount + items.length > env.GUEST_MAX_SCENES_PER_PROJECT) {
      throw new AppError({
        code: "SCENE_QUOTA_EXCEEDED",
        message: `Projects may contain up to ${env.GUEST_MAX_SCENES_PER_PROJECT} scenes in MVP.`,
        statusCode: 400,
      })
    }

    return sceneRepository.createManyWithAssets(items)
  },

  async update(sceneId: string, input: UpdateSceneInput) {
    return sceneRepository.update(sceneId, {
      contextText: input.contextText,
      motionPreset: input.motionPreset,
      motionIntensity: input.motionIntensity,
      grouping: input.grouping,
    })
  },

  async reorder(projectId: string, sceneIds: string[]) {
    return sceneRepository.reorder(projectId, sceneIds)
  },

  async remove(sceneId: string) {
    await sceneRepository.delete(sceneId)
  },

  async enqueueDecomposition(sceneId: string, input: { correlationId: string; reason?: string; resetGeneration?: boolean }) {
    const scene = await this.getById(sceneId)
    const activeJob = await sceneRepository.findActiveDecompositionJob(sceneId)

    if (activeJob) {
      throw new AppError({
        code: "DECOMPOSITION_ALREADY_ACTIVE",
        message: "A decomposition job is already active for this scene.",
        statusCode: 409,
      })
    }

    if (input.resetGeneration) {
      await sceneRepository.updateSceneStatus(sceneId, {
        generationVersion: scene.generationVersion + 1,
        status: SceneStatus.queued,
      })
    } else {
      await sceneRepository.updateSceneStatus(sceneId, {
        status: SceneStatus.queued,
      })
    }

    return sceneRepository.createDecompositionJob(sceneId, {
      correlationId: input.correlationId,
      metadataJson: {
        reason: input.reason ?? null,
      },
    })
  },

  async markProcessing(jobId: string, sceneId: string, attemptCount: number, providerJobId?: string | null) {
    await sceneRepository.updateSceneStatus(sceneId, {
      status: SceneStatus.processing,
    })

    await sceneRepository.updateJob(jobId, {
      status: JobStatus.processing,
      attemptCount,
      providerJobId,
      startedAt: new Date(),
      errorMessage: null,
    })
  },

  async markReady(jobId: string, sceneId: string) {
    await sceneRepository.updateSceneStatus(sceneId, {
      status: SceneStatus.ready,
    })

    await sceneRepository.updateJob(jobId, {
      status: JobStatus.ready,
      completedAt: new Date(),
      errorMessage: null,
    })
  },

  async markFailed(jobId: string, sceneId: string, message: string, attemptCount: number) {
    await sceneRepository.updateSceneStatus(sceneId, {
      status: SceneStatus.failed,
    })

    await sceneRepository.updateJob(jobId, {
      status: JobStatus.failed,
      completedAt: new Date(),
      errorMessage: message,
      attemptCount,
    })
  },
}
