import { DEFAULT_SCENE_LAYER_COUNT } from "@/config/constants"
import { metrics } from "@/core/observability/metrics"
import { logProcessingEvent } from "@/core/observability/processing-log"
import { assetService } from "@/modules/assets"
import { decompositionAdapter } from "@/modules/decomposition/adapter"
import { ProviderError } from "@/modules/decomposition/types"
import { featureFlagService } from "@/modules/feature-flags"
import { motionService } from "@/modules/motion"
import { playbackService } from "@/modules/playback"
import { sceneService } from "@/modules/scenes"

export const decompositionService = {
  async processScene(scene: {
    id: string
    generationVersion: number
    sourceImageUrl: string | null
    expiresAt: Date | null
    project: { id: string }
    assets: Array<{ assetType: string; metadataJson: unknown }>
  }, job: { id: string; attemptCount: number; correlationId?: string | null }) {
    const startedAt = Date.now()

    if (!scene.sourceImageUrl) {
      throw new ProviderError("terminal", "SCENE_SOURCE_MISSING", "Scene does not have a source image URL.")
    }

    const originalAsset = scene.assets.find((asset) => asset.assetType === "original")
    const metadata = typeof originalAsset?.metadataJson === "object" && originalAsset?.metadataJson ? originalAsset.metadataJson as Record<string, unknown> : {}

    const attemptCount = job.attemptCount + 1
    const correlationId = job.correlationId ?? crypto.randomUUID()
    const result = await decompositionAdapter.decompose({
      projectId: scene.project.id,
      sceneId: scene.id,
      imageUrl: scene.sourceImageUrl,
      mimeType: typeof metadata.mimeType === "string" ? metadata.mimeType : "image/png",
      width: typeof metadata.width === "number" ? metadata.width : undefined,
      height: typeof metadata.height === "number" ? metadata.height : undefined,
      targetLayers: DEFAULT_SCENE_LAYER_COUNT,
      correlationId,
    })

    await sceneService.markProcessing(job.id, scene.id, attemptCount, result.providerJobId)

    await assetService.persistDecompositionAssets({
      projectId: scene.project.id,
      sceneId: scene.id,
      generationVersion: scene.generationVersion,
      sourceAssetPath: scene.sourceImageUrl,
      expiresAt: scene.expiresAt,
      width: result.width,
      height: result.height,
      compositeArtifact: result.compositeArtifact,
      thumbnailArtifact: result.thumbnailArtifact,
      layers: result.layers.map((layer) => ({
        index: layer.index,
        width: layer.width,
        height: layer.height,
        artifact: layer.artifact,
        metadata: {
          ...layer.metadata,
          modelVersion: result.modelVersion,
        },
      })),
    })

    const refreshedScene = await sceneService.getById(scene.id)

    if (featureFlagService.isEnabled("motionPipeline")) {
      await motionService.generateForScene({
        id: refreshedScene.id,
        projectId: refreshedScene.projectId,
        assets: refreshedScene.assets.map((asset) => ({
          assetType: asset.assetType,
          layerOrder: asset.layerOrder,
          metadataJson: asset.metadataJson,
        })),
        motionPreset: refreshedScene.motionPreset,
        motionIntensity: refreshedScene.motionIntensity,
        framingData: refreshedScene.framingData,
      }, correlationId)
    }

    await sceneService.markReady(job.id, scene.id)

    if (featureFlagService.isEnabled("playbackPipeline")) {
      await playbackService.stitchProject(scene.project.id, {
        traceId: correlationId,
        allowFallback: true,
      })
    }

    metrics.observe("processing_decomposition_duration_ms", Date.now() - startedAt)
    logProcessingEvent({
      event: "scene decomposition completed",
      traceId: correlationId,
      projectId: scene.project.id,
      sceneId: scene.id,
      jobId: job.id,
      details: {
        providerJobId: result.providerJobId,
      },
    })
  },
}
