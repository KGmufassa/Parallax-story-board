import type { EasingKey, GroupKey, MobileGroupScrollMapping, SceneGroupingConfig } from "@/modules/scenes/types"

export type ApiEnvelope<T> = {
  data: T
}

export type ApiErrorEnvelope = {
  error?: {
    message?: string
  }
}

export type ProjectSceneAssetRecord = {
  assetUrl: string
  assetType?: string
  layerOrder?: number | null
  metadataJson?: unknown
}

export type ProjectSceneRecord = {
  id: string
  orderIndex: number
  status: string
  contextText: string | null
  motionPreset?: string | null
  motionIntensity?: string | null
  sourceImageUrl: string | null
  thumbnailUrl: string | null
  framingData?: SceneGroupingConfig | null
  assets?: ProjectSceneAssetRecord[]
}

export type ProjectRecord = {
  id: string
  title: string
  status: string
  globalContext?: string | null
  stylePreset?: string | null
  outputFormat?: string
  guestSessionId?: string | null
  ownerId?: string | null
  claimedAt?: string | null
  scenes: ProjectSceneRecord[]
}

export type PlaybackLayerBehavior = {
  layerIndex?: number
  parallax?: number
  scale?: number
  opacity?: number
  groupKey?: GroupKey
  startProgress?: number
  endProgress?: number
  translateX?: number
  translateY?: number
  scaleFrom?: number
  scaleTo?: number
  opacityFrom?: number
  opacityTo?: number
  speedMultiplier?: number
  easing?: EasingKey
  mobile?: MobileGroupScrollMapping
  tablet?: MobileGroupScrollMapping
  desktop?: MobileGroupScrollMapping
}

export type PlaybackTimelineScene = {
  sceneId: string
  orderIndex: number
  status: string
  sourceImageUrl: string | null
  thumbnailUrl: string | null
  fallback: boolean
  startsAtMs: number
  durationMs: number
  cameraMovement?: string
  intensity?: string
  layerBehaviors?: PlaybackLayerBehavior[]
}

export type PlaybackResponse = {
  version?: number
  isFallback: boolean
  isReducedMotion: boolean
  timelineJson?: {
    scenes?: PlaybackTimelineScene[]
    summary?: {
      totalDurationMs?: number
    }
  }
}

export type NormalizedPlaybackSceneLayer = {
  assetUrl: string
  layerOrder: number
  metadataJson?: unknown
}

export type NormalizedPlaybackScene = {
  id: string
  orderIndex: number
  status: string
  title: string
  detail: string
  imageUrl: string | null
  fallback: boolean
  durationMs?: number
  startsAtMs?: number
  cameraMovement: string
  intensity: string
  contextText: string | null
  groupingConfig: SceneGroupingConfig | null
  layerBehaviors: PlaybackLayerBehavior[]
  layerAssets: NormalizedPlaybackSceneLayer[]
}

export type NormalizedPlaybackState = {
  projectTitle: string
  projectStatus: string
  isFallback: boolean
  isReducedMotion: boolean
  playbackVersion: number | null
  totalDurationMs: number
  scenes: NormalizedPlaybackScene[]
}

export function isRenderableImageUrl(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/") || value.startsWith("data:")
}

export function resolveProjectSceneImage(scene: ProjectSceneRecord) {
  if (isRenderableImageUrl(scene.sourceImageUrl)) {
    return scene.sourceImageUrl
  }

  if (isRenderableImageUrl(scene.thumbnailUrl)) {
    return scene.thumbnailUrl
  }

  const assetUrl = scene.assets?.find((asset) => isRenderableImageUrl(asset.assetUrl))?.assetUrl
  return assetUrl ?? null
}

export async function parseApiResponse<T>(response: Response, fallbackMessage = "Request failed.") {
  const contentType = response.headers.get("content-type") ?? ""
  const payload = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorEnvelope | null)
    : null

  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.message ?? fallbackMessage : fallbackMessage)
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response from the server.")
  }

  return payload.data
}

function normalizeProject(project: ProjectRecord | null | undefined) {
  return {
    title: project?.title ?? "Project Preview",
    status: project?.status ?? "draft",
    scenes: Array.isArray(project?.scenes) ? project.scenes : [],
  }
}

function normalizePlayback(playback: PlaybackResponse | null | undefined) {
  return {
    version: typeof playback?.version === "number" ? playback.version : null,
    isFallback: playback?.isFallback ?? false,
    isReducedMotion: playback?.isReducedMotion ?? false,
    totalDurationMs:
      typeof playback?.timelineJson?.summary?.totalDurationMs === "number" ? playback.timelineJson.summary.totalDurationMs : null,
    scenes: Array.isArray(playback?.timelineJson?.scenes) ? playback.timelineJson.scenes : [],
  }
}

function formatSceneTitle(index: number) {
  return `Scene ${String(index + 1).padStart(2, "0")}`
}

function formatSceneDetail(source: { startsAtMs?: number; durationMs?: number; contextText?: string | null; cameraMovement?: string }) {
  if (source.contextText) {
    return source.contextText
  }

  if (typeof source.startsAtMs === "number" && typeof source.durationMs === "number") {
    const startSeconds = (source.startsAtMs / 1000).toFixed(1)
    const durationSeconds = (source.durationMs / 1000).toFixed(1)
    const movement = source.cameraMovement ? ` - ${source.cameraMovement}` : ""
    return `Starts at ${startSeconds}s for ${durationSeconds}s${movement}`
  }

  return "Preview section ready for scroll playback."
}

function resolveLayerAssets(scene: ProjectSceneRecord | undefined) {
  return (scene?.assets ?? [])
    .filter((asset) => {
      if (!isRenderableImageUrl(asset.assetUrl)) {
        return false
      }

      if (asset.assetType) {
        return asset.assetType === "layer"
      }

      return typeof asset.layerOrder === "number"
    })
    .map((asset, index) => ({
      assetUrl: asset.assetUrl,
      layerOrder: typeof asset.layerOrder === "number" ? asset.layerOrder : index,
      metadataJson: asset.metadataJson,
    }))
    .sort((left, right) => left.layerOrder - right.layerOrder)
}

function parseSceneGroupingConfig(value: unknown): SceneGroupingConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>

  if (record.version !== 1 || !Array.isArray(record.groups)) {
    return null
  }

  return value as SceneGroupingConfig
}

export function buildNormalizedPlaybackState(project: ProjectRecord | null | undefined, playback: PlaybackResponse | null | undefined) {
  const normalizedProject = normalizeProject(project)
  const normalizedPlayback = normalizePlayback(playback)
  const projectScenes = [...normalizedProject.scenes].sort((left, right) => left.orderIndex - right.orderIndex)
  const projectScenesById = new Map(projectScenes.map((scene) => [scene.id, scene]))

  const scenesFromPlayback = normalizedPlayback.scenes
    .map((scene, index) => {
      const projectScene = projectScenesById.get(scene.sceneId)

      return {
        id: scene.sceneId,
        orderIndex: scene.orderIndex,
        status: scene.status,
        title: formatSceneTitle(index),
        detail: formatSceneDetail({
          startsAtMs: scene.startsAtMs,
          durationMs: scene.durationMs,
          cameraMovement: scene.cameraMovement,
          contextText: projectScene?.contextText,
        }),
        imageUrl:
          (isRenderableImageUrl(scene.sourceImageUrl) ? scene.sourceImageUrl : null) ??
          (isRenderableImageUrl(scene.thumbnailUrl) ? scene.thumbnailUrl : null) ??
          (projectScene ? resolveProjectSceneImage(projectScene) : null),
        fallback: scene.fallback,
        durationMs: scene.durationMs,
        startsAtMs: scene.startsAtMs,
        cameraMovement: scene.cameraMovement ?? "drift-up",
        intensity: scene.intensity ?? "medium",
        contextText: projectScene?.contextText ?? null,
        groupingConfig: parseSceneGroupingConfig(projectScene?.framingData),
        layerBehaviors: Array.isArray(scene.layerBehaviors) ? scene.layerBehaviors : [],
        layerAssets: resolveLayerAssets(projectScene),
      } satisfies NormalizedPlaybackScene
    })
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((scene, index) => ({
      ...scene,
      title: formatSceneTitle(index),
    }))

  const scenesFromProject = projectScenes.map((scene, index) => ({
    id: scene.id,
    orderIndex: scene.orderIndex,
    status: scene.status,
    title: formatSceneTitle(index),
    detail: formatSceneDetail({ contextText: scene.contextText }),
    imageUrl: resolveProjectSceneImage(scene),
    fallback: false,
    durationMs: undefined,
    startsAtMs: undefined,
    cameraMovement: "drift-up",
    intensity: "medium",
    contextText: scene.contextText,
    groupingConfig: parseSceneGroupingConfig(scene.framingData),
    layerBehaviors: [],
    layerAssets: resolveLayerAssets(scene),
  }))

  const scenes = scenesFromPlayback.length > 0 ? scenesFromPlayback : scenesFromProject
  const totalDurationMs =
    normalizedPlayback.totalDurationMs ?? scenes.reduce((total, scene) => total + (scene.durationMs ?? 2200), 0)

  return {
    projectTitle: normalizedProject.title,
    projectStatus: normalizedProject.status,
    isFallback: normalizedPlayback.isFallback,
    isReducedMotion: normalizedPlayback.isReducedMotion,
    playbackVersion: normalizedPlayback.version,
    totalDurationMs,
    scenes,
  } satisfies NormalizedPlaybackState
}
