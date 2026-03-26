import { AssetType, JobStatus, JobType, Prisma, SceneStatus } from "@prisma/client"

import { prisma } from "@/infrastructure/db/prisma"

export const sceneRepository = {
  findById(id: string) {
    return prisma.scene.findUnique({
      where: { id },
      include: {
        project: true,
        assets: {
          orderBy: [{ layerOrder: "asc" }, { createdAt: "asc" }],
        },
        processingJobs: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  async nextOrderIndex(projectId: string) {
    const result = await prisma.scene.aggregate({
      where: { projectId },
      _max: { orderIndex: true },
    })

    return (result._max.orderIndex ?? -1) + 1
  },

  createManyWithAssets(items: Array<{
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
    return prisma.$transaction(
      items.map((item) =>
        prisma.scene.create({
          data: {
            id: item.id,
            projectId: item.projectId,
            orderIndex: item.orderIndex,
            generationVersion: item.generationVersion ?? 1,
            sourceImageUrl: item.sourceImageUrl,
            thumbnailUrl: item.thumbnailUrl,
            contextText: item.contextText,
            motionPreset: item.motionPreset,
            motionIntensity: item.motionIntensity,
            expiresAt: item.expiresAt,
            assets: {
              create: [
                {
                  assetType: AssetType.original,
                  assetUrl: item.originalAsset.assetUrl,
                  width: item.originalAsset.width,
                  height: item.originalAsset.height,
                  metadataJson: item.originalAsset.metadataJson,
                  expiresAt: item.expiresAt,
                },
                {
                  assetType: AssetType.thumbnail,
                  assetUrl: item.thumbnailAsset.assetUrl,
                  width: item.thumbnailAsset.width,
                  height: item.thumbnailAsset.height,
                  metadataJson: item.thumbnailAsset.metadataJson,
                  expiresAt: item.expiresAt,
                },
              ],
            },
          },
          include: {
            assets: true,
          },
        }),
      ),
    )
  },

  update(id: string, data: {
    contextText?: string | null
    motionPreset?: string | null
    motionIntensity?: string | null
    grouping?: Prisma.InputJsonValue | null
  }) {
    return prisma.scene.update({
      where: { id },
      data: {
        contextText: data.contextText,
        motionPreset: data.motionPreset,
        motionIntensity: data.motionIntensity,
        framingData: data.grouping === null ? Prisma.JsonNull : data.grouping,
      },
      include: {
        project: true,
        assets: {
          orderBy: [{ layerOrder: "asc" }, { createdAt: "asc" }],
        },
        processingJobs: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  setMotionBlueprint(sceneId: string, blueprint: Prisma.InputJsonValue) {
    return prisma.scene.update({
      where: { id: sceneId },
      data: {
        motionBlueprintJson: blueprint,
      },
      include: {
        project: true,
        assets: {
          orderBy: [{ layerOrder: "asc" }, { createdAt: "asc" }],
        },
        processingJobs: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
  },

  findByProjectId(projectId: string) {
    return prisma.scene.findMany({
      where: { projectId },
      include: {
        project: true,
        assets: {
          orderBy: [{ layerOrder: "asc" }, { createdAt: "asc" }],
        },
        processingJobs: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    })
  },

  async reorder(projectId: string, sceneIds: string[]) {
    return prisma.$transaction(
      sceneIds.map((sceneId, index) =>
        prisma.scene.updateMany({
          where: { id: sceneId, projectId },
          data: { orderIndex: index },
        }),
      ),
    )
  },

  delete(id: string) {
    return prisma.scene.delete({
      where: { id },
    })
  },

  findActiveDecompositionJob(sceneId: string) {
    return prisma.processingJob.findFirst({
      where: {
        sceneId,
        jobType: JobType.decomposition,
        status: { in: [JobStatus.queued, JobStatus.processing] },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  countByProjectId(projectId: string) {
    return prisma.scene.count({
      where: { projectId },
    })
  },

  createDecompositionJob(sceneId: string, data: { correlationId: string; metadataJson?: Prisma.InputJsonValue }) {
    return prisma.processingJob.create({
      data: {
        sceneId,
        jobType: JobType.decomposition,
        status: JobStatus.queued,
        correlationId: data.correlationId,
        metadataJson: data.metadataJson,
      },
    })
  },

  findTimedOutJobs(timeoutBefore: Date) {
    return prisma.processingJob.findMany({
      where: {
        status: { in: [JobStatus.queued, JobStatus.processing] },
        OR: [
          { startedAt: { lt: timeoutBefore } },
          { startedAt: null, createdAt: { lt: timeoutBefore } },
        ],
      },
      include: {
        scene: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  },

  updateJob(jobId: string, data: {
    status?: JobStatus
    providerJobId?: string | null
    attemptCount?: number
    errorMessage?: string | null
    startedAt?: Date | null
    completedAt?: Date | null
    metadataJson?: Prisma.InputJsonValue
  }) {
    return prisma.processingJob.update({
      where: { id: jobId },
      data,
    })
  },

  updateSceneStatus(sceneId: string, data: {
    status?: SceneStatus
    generationVersion?: number
  }) {
    return prisma.scene.update({
      where: { id: sceneId },
      data,
    })
  },

  replaceGeneratedAssets(sceneId: string, data: {
    expiresAt?: Date | null
    layerAssets: Array<{ assetUrl: string; width?: number; height?: number; layerOrder: number; metadataJson?: Prisma.InputJsonValue }>
    compositeAsset: { assetUrl: string; width?: number; height?: number; metadataJson?: Prisma.InputJsonValue }
    manifestAsset: { assetUrl: string; metadataJson?: Prisma.InputJsonValue }
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.sceneAsset.deleteMany({
        where: {
          sceneId,
          assetType: { in: [AssetType.layer, AssetType.composite, AssetType.manifest] },
        },
      })

      await tx.sceneAsset.createMany({
        data: [
          ...data.layerAssets.map((asset) => ({
            sceneId,
            assetType: AssetType.layer,
            assetUrl: asset.assetUrl,
            width: asset.width,
            height: asset.height,
            layerOrder: asset.layerOrder,
            metadataJson: asset.metadataJson,
            expiresAt: data.expiresAt,
          })),
          {
            sceneId,
            assetType: AssetType.composite,
            assetUrl: data.compositeAsset.assetUrl,
            width: data.compositeAsset.width,
            height: data.compositeAsset.height,
            metadataJson: data.compositeAsset.metadataJson,
            expiresAt: data.expiresAt,
          },
          {
            sceneId,
            assetType: AssetType.manifest,
            assetUrl: data.manifestAsset.assetUrl,
            metadataJson: data.manifestAsset.metadataJson,
            expiresAt: data.expiresAt,
          },
        ],
      })

      return tx.scene.findUnique({
        where: { id: sceneId },
        include: {
          assets: {
            orderBy: [{ layerOrder: "asc" }, { createdAt: "asc" }],
          },
          processingJobs: {
            orderBy: { createdAt: "desc" },
          },
          project: true,
        },
      })
    })
  },
}
