import { created, ok } from "@/lib/api-response"
import { parseJsonBody } from "@/interfaces/http/support/json-body"
import { resolveRequestActor } from "@/interfaces/http/support/request-actor"
import { ensureProjectAccess } from "@/interfaces/http/support/authorization"
import { finalizeUploadsInputSchema, sceneReprocessInputSchema, updateSceneInputSchema } from "@/modules/scenes"
import { projectService } from "@/modules/projects"
import { sceneService } from "@/modules/scenes"
import { uploadService } from "@/modules/uploads"
import { assetStorageService, buildThumbnailAssetPath, serializeScene } from "@/modules/assets"
import { processingService } from "@/modules/processing"
import { motionService } from "@/modules/motion"
import { playbackService } from "@/modules/playback"
import { AppError } from "@/core/errors/app-error"
import type { RequestContext } from "@/core/request/context"

export const sceneController = {
  async finalizeUploads(projectId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "edit", project)
    const input = await parseJsonBody(request, finalizeUploadsInputSchema)

    const startIndex = await sceneService.nextOrderIndex(projectId)
    const scenes = await sceneService.createFromUploads(
      input.uploads.map((upload, index) => {
        const token = uploadService.verifyUploadToken(upload.uploadToken)

        if (token.projectId !== projectId) {
          throw new AppError({
            code: "UPLOAD_PROJECT_MISMATCH",
            message: "Upload token does not belong to this project.",
            statusCode: 400,
          })
        }

        if (token.mimeType !== upload.mimeType || token.sizeBytes !== upload.sizeBytes) {
          throw new AppError({
            code: "UPLOAD_METADATA_MISMATCH",
            message: "Upload metadata does not match the original upload contract.",
            statusCode: 400,
          })
        }

        const sceneId = crypto.randomUUID()
        const generationVersion = 1
        const thumbnailPath = buildThumbnailAssetPath(projectId, sceneId, generationVersion)

        return {
          id: sceneId,
          projectId,
          orderIndex: startIndex + index,
          generationVersion,
          sourceImageUrl: token.storageKey,
          thumbnailUrl: thumbnailPath,
          contextText: upload.contextText ?? null,
          motionPreset: upload.motionPreset ?? null,
          motionIntensity: upload.motionIntensity ?? null,
          expiresAt: project.expiresAt,
          originalAsset: {
            assetUrl: token.storageKey,
            width: upload.width,
            height: upload.height,
            metadataJson: {
              filename: upload.originalFilename,
              mimeType: upload.mimeType,
              sizeBytes: upload.sizeBytes,
              width: upload.width ?? null,
              height: upload.height ?? null,
            },
          },
          thumbnailAsset: {
            assetUrl: thumbnailPath,
            width: 320,
            height: 568,
            metadataJson: {
              derivedFrom: token.storageKey,
              kind: "generated-thumbnail",
            },
          },
        }
      }),
    )

    await Promise.all(
      scenes.map((scene) => {
        if (!scene.sourceImageUrl || !scene.thumbnailUrl) {
          return Promise.resolve()
        }

        return assetStorageService.copy(scene.sourceImageUrl, scene.thumbnailUrl)
      }),
    )

    for (const scene of scenes) {
      await processingService.enqueueSceneDecomposition(scene.id, context.correlationId, {
        reason: "upload-finalized",
      })
    }

    return created(scenes.map((scene) => serializeScene(scene)), { correlationId: context.correlationId })
  },

  async update(sceneId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const scene = await sceneService.getById(sceneId)
    ensureProjectAccess(actor, "edit", scene.project)
    const input = await parseJsonBody(request, updateSceneInputSchema)
    const updatedScene = await sceneService.update(sceneId, input)
    const refreshedScene = await motionService.generateForScene({
      id: updatedScene.id,
      projectId: updatedScene.projectId,
      assets: updatedScene.assets.map((asset) => ({
        assetType: asset.assetType,
        layerOrder: asset.layerOrder,
        metadataJson: asset.metadataJson,
      })),
      motionPreset: updatedScene.motionPreset,
      motionIntensity: updatedScene.motionIntensity,
      framingData: updatedScene.framingData,
    }, context.correlationId)
    await playbackService.stitchProject(scene.projectId, {
      allowFallback: true,
      traceId: context.correlationId,
    }).catch(() => null)
    return ok(serializeScene(refreshedScene), { correlationId: context.correlationId })
  },

  async remove(sceneId: string, context: RequestContext) {
    const actor = await resolveRequestActor()
    const scene = await sceneService.getById(sceneId)
    ensureProjectAccess(actor, "edit", scene.project)
    await sceneService.remove(sceneId)
    await playbackService.stitchProject(scene.projectId, {
      allowFallback: true,
      traceId: context.correlationId,
    }).catch(() => null)
    return ok({ deleted: true }, { correlationId: context.correlationId })
  },

  async retry(sceneId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const scene = await sceneService.getById(sceneId)
    ensureProjectAccess(actor, "edit", scene.project)
    const input = await parseJsonBody(request, sceneReprocessInputSchema)
    const result = await processingService.enqueueSceneDecomposition(sceneId, context.correlationId, {
      reason: input.reason ?? "manual-retry",
    })
    return created(result.job, { correlationId: context.correlationId })
  },

  async regenerate(sceneId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const scene = await sceneService.getById(sceneId)
    ensureProjectAccess(actor, "edit", scene.project)
    const input = await parseJsonBody(request, sceneReprocessInputSchema)
    const result = await processingService.enqueueSceneDecomposition(sceneId, context.correlationId, {
      reason: input.reason ?? "manual-regenerate",
      resetGeneration: true,
    })
    return created(result.job, { correlationId: context.correlationId })
  },
}
