import { Prisma, SceneStatus } from "@prisma/client"

import { DEFAULT_SCENE_DURATION_MS, DEFAULT_SCENE_OVERLAP_MS } from "@/config/constants"
import { AppError } from "@/core/errors/app-error"
import { metrics } from "@/core/observability/metrics"
import { logProcessingEvent } from "@/core/observability/processing-log"
import { featureFlagService } from "@/modules/feature-flags"
import { projectRepository } from "@/modules/projects/repository"
import { sceneRepository } from "@/modules/scenes/repository"

type StitchOptions = {
  reducedMotion?: boolean
  allowFallback?: boolean
  traceId?: string | null
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits))
}

function applyReducedMotionToLayerBehavior(layer: Record<string, any>, multiplier: number) {
  const nextLayer: Record<string, unknown> = {
    ...layer,
    parallax: round((layer.parallax ?? 0.2) * multiplier),
  }

  for (const deviceKey of ["mobile", "tablet", "desktop"] as const) {
    const mapping = layer[deviceKey]

    if (!mapping || typeof mapping !== "object") {
      continue
    }

    nextLayer[deviceKey] = {
      ...mapping,
      translateX: round(((mapping.translateX as number | undefined) ?? 0) * multiplier),
      translateY: round(((mapping.translateY as number | undefined) ?? 0) * multiplier),
      scaleFrom: round(1 + ((((mapping.scaleFrom as number | undefined) ?? 1) - 1) * multiplier)),
      scaleTo: round(1 + ((((mapping.scaleTo as number | undefined) ?? 1) - 1) * multiplier)),
      speedMultiplier: round(((mapping.speedMultiplier as number | undefined) ?? 1) * multiplier),
    }
  }

  if (typeof layer.translateX === "number") {
    nextLayer.translateX = round(layer.translateX * multiplier)
  }

  if (typeof layer.translateY === "number") {
    nextLayer.translateY = round(layer.translateY * multiplier)
  }

  if (typeof layer.scaleFrom === "number") {
    nextLayer.scaleFrom = round(1 + (layer.scaleFrom - 1) * multiplier)
  }

  if (typeof layer.scaleTo === "number") {
    nextLayer.scaleTo = round(1 + (layer.scaleTo - 1) * multiplier)
  }

  if (typeof layer.speedMultiplier === "number") {
    nextLayer.speedMultiplier = round(layer.speedMultiplier * multiplier)
  }

  return nextLayer
}

function deriveSceneDuration(scene: { motionIntensity?: string | null }) {
  const value = scene.motionIntensity?.toLowerCase() ?? ""
  if (value.includes("high")) {
    return 2600
  }
  if (value.includes("low")) {
    return 1800
  }
  return DEFAULT_SCENE_DURATION_MS
}

export const playbackService = {
  buildTimeline(
    projectId: string,
    scenes: Array<{
      id: string
      orderIndex: number
      status: SceneStatus
      thumbnailUrl: string | null
      sourceImageUrl: string | null
      motionIntensity: string | null
      motionBlueprintJson: Prisma.JsonValue | null
    }>,
    options: { reducedMotion?: boolean; allowFallback?: boolean },
  ) {
    const reducedMotion = Boolean(options.reducedMotion && featureFlagService.isEnabled("reducedMotionPreview"))
    const allowFallback = options.allowFallback ?? featureFlagService.isEnabled("previewFallbacks")
    const readyScenes = scenes.filter((scene) => scene.status === SceneStatus.ready && scene.motionBlueprintJson)
    const renderableScenes = allowFallback ? readyScenes : scenes

    if (!allowFallback && scenes.some((scene) => scene.status !== SceneStatus.ready || !scene.motionBlueprintJson)) {
      throw new AppError({
        code: "PLAYBACK_NOT_READY",
        message: "All scenes must be ready before stitching without fallback support.",
        statusCode: 409,
      })
    }

    if (renderableScenes.length === 0) {
      throw new AppError({
        code: "NO_RENDERABLE_SCENES",
        message: "No scenes are ready for playback yet.",
        statusCode: 409,
      })
    }

    let cursorMs = 0
    const timelineScenes = renderableScenes.map((scene, index) => {
      const durationMs = deriveSceneDuration(scene)
      const overlapMs = index === 0 ? 0 : DEFAULT_SCENE_OVERLAP_MS
      const startsAtMs = Math.max(cursorMs - overlapMs, 0)
      const blueprint = (scene.motionBlueprintJson ?? {}) as Record<string, any>
      cursorMs = startsAtMs + durationMs

      return {
        sceneId: scene.id,
        orderIndex: scene.orderIndex,
        status: scene.status,
        startsAtMs,
        durationMs,
        overlapMs,
        thumbnailUrl: scene.thumbnailUrl,
        sourceImageUrl: scene.sourceImageUrl,
        cameraMovement: reducedMotion ? "hold" : blueprint.cameraMovement ?? "drift-up",
        intensity: reducedMotion ? "low" : blueprint.intensity ?? "medium",
        layerBehaviors: reducedMotion
          ? Array.isArray(blueprint.layerBehaviors)
            ? blueprint.layerBehaviors.map((layer: any) => applyReducedMotionToLayerBehavior(layer, blueprint.reducedMotion?.multiplier ?? 0.2))
            : []
          : blueprint.layerBehaviors ?? [],
        transition: blueprint.transition ?? { overlapMs: DEFAULT_SCENE_OVERLAP_MS, easing: "ease-out" },
        fallback: scene.status !== SceneStatus.ready,
      }
    })

    return {
      projectId,
      versionedAt: new Date().toISOString(),
      reducedMotion,
      isFallback: readyScenes.length !== scenes.length,
      summary: {
        totalScenes: scenes.length,
        renderableScenes: renderableScenes.length,
        failedScenes: scenes.filter((scene) => scene.status === SceneStatus.failed).length,
        pendingScenes: scenes.filter((scene) => scene.status !== SceneStatus.ready && scene.status !== SceneStatus.failed).length,
        totalDurationMs: cursorMs,
      },
      scenes: timelineScenes,
    }
  },

  async stitchProject(projectId: string, options?: StitchOptions) {
    const startedAt = Date.now()
    const scenes = await sceneRepository.findByProjectId(projectId)

    if (scenes.length === 0) {
      throw new AppError({
        code: "NO_SCENES_AVAILABLE",
        message: "Project does not have scenes to stitch.",
        statusCode: 409,
      })
    }

    const timeline = this.buildTimeline(projectId, scenes, {
      reducedMotion: options?.reducedMotion,
      allowFallback: options?.allowFallback,
    })

    const versionAgg = await projectRepository.nextPlaybackPlanVersion(projectId)
    const playbackPlan = await projectRepository.createPlaybackPlan({
      projectId,
      version: (versionAgg._max.version ?? 0) + 1,
      timelineJson: timeline as Prisma.InputJsonValue,
      isReducedMotion: timeline.reducedMotion,
      isFallback: timeline.isFallback,
    })

    metrics.observe("processing_playback_duration_ms", Date.now() - startedAt)
    logProcessingEvent({
      event: "playback plan stitched",
      traceId: options?.traceId,
      projectId,
      details: {
        playbackPlanId: playbackPlan.id,
        version: playbackPlan.version,
        reducedMotion: timeline.reducedMotion,
        isFallback: timeline.isFallback,
        renderableScenes: timeline.summary.renderableScenes,
      },
    })

    return playbackPlan
  },

  async latest(projectId: string, options?: { reducedMotion?: boolean }) {
    const plan = await projectRepository.latestPlaybackPlan(projectId, {
      isReducedMotion: options?.reducedMotion,
    })

    if (plan) {
      return plan
    }

    return this.stitchProject(projectId, {
      reducedMotion: options?.reducedMotion,
      allowFallback: true,
    })
  },

  async previewStatus(projectId: string) {
    const project = await projectRepository.findById(projectId)

    if (!project) {
      throw new AppError({
        code: "PROJECT_NOT_FOUND",
        message: "Project was not found.",
        statusCode: 404,
      })
    }

    const latestPlayback = await projectRepository.latestPlaybackPlan(projectId)
    const latestReducedPlayback = await projectRepository.latestPlaybackPlan(projectId, { isReducedMotion: true })

    return {
      projectId: project.id,
      title: project.title,
      status: project.status,
      playback: {
        latestVersion: latestPlayback?.version ?? null,
        reducedMotionVersion: latestReducedPlayback?.version ?? null,
        isFallback: latestPlayback?.isFallback ?? null,
      },
      scenes: project.scenes.map((scene) => ({
        sceneId: scene.id,
        orderIndex: scene.orderIndex,
        status: scene.status,
        hasMotionBlueprint: Boolean(scene.motionBlueprintJson),
        latestJobStatus: scene.processingJobs[0]?.status ?? null,
      })),
    }
  },
}
