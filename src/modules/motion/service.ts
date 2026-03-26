import { Prisma } from "@prisma/client"

import { DEFAULT_SCENE_OVERLAP_MS } from "@/config/constants"
import { metrics } from "@/core/observability/metrics"
import { logProcessingEvent } from "@/core/observability/processing-log"
import { sceneRepository } from "@/modules/scenes/repository"
import type {
  EasingKey,
  GroupKey,
  MobileGroupScrollMapping,
  SceneGroupConfig,
  SceneGroupingConfig,
} from "@/modules/scenes"
import type { MotionBlueprint, MotionLayerBehavior } from "@/modules/motion/types"

const GROUP_KEYS: GroupKey[] = ["background", "midground", "foreground"]

const GROUP_DEFAULTS: Record<GroupKey, MobileGroupScrollMapping> = {
  background: {
    startProgress: 0,
    endProgress: 1,
    translateX: -6,
    translateY: -18,
    scaleFrom: 1,
    scaleTo: 1.06,
    opacityFrom: 1,
    opacityTo: 0.94,
    speedMultiplier: 0.72,
    easing: "ease-out",
  },
  midground: {
    startProgress: 0,
    endProgress: 1,
    translateX: 0,
    translateY: -30,
    scaleFrom: 1,
    scaleTo: 1.1,
    opacityFrom: 1,
    opacityTo: 0.98,
    speedMultiplier: 1,
    easing: "linear",
  },
  foreground: {
    startProgress: 0,
    endProgress: 1,
    translateX: 10,
    translateY: -46,
    scaleFrom: 1,
    scaleTo: 1.16,
    opacityFrom: 1,
    opacityTo: 1,
    speedMultiplier: 1.22,
    easing: "ease-in-out",
  },
}

const GROUP_PARALLAX_WEIGHT: Record<GroupKey, number> = {
  background: 0.36,
  midground: 0.62,
  foreground: 0.9,
}

function intensityFromPreset(value: string | null | undefined): MotionBlueprint["intensity"] {
  if (!value) {
    return "medium"
  }

  const normalized = value.toLowerCase()
  if (normalized.includes("low") || normalized.includes("gentle")) {
    return "low"
  }
  if (normalized.includes("high") || normalized.includes("dramatic")) {
    return "high"
  }
  return "medium"
}

function movementFromPreset(value: string | null | undefined): MotionBlueprint["cameraMovement"] {
  if (!value) {
    return "drift-up"
  }

  const normalized = value.toLowerCase()
  if (normalized.includes("push")) {
    return "push-in"
  }
  if (normalized.includes("right") || normalized.includes("pan")) {
    return "drift-right"
  }
  if (normalized.includes("still") || normalized.includes("hold")) {
    return "hold"
  }
  return "drift-up"
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits))
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function toLayerIndex(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null
}

function toEasingKey(value: unknown): EasingKey | null {
  return value === "linear" || value === "ease-out" || value === "ease-in-out" ? value : null
}

function toGroupKey(value: unknown): GroupKey | null {
  return value === "background" || value === "midground" || value === "foreground" ? value : null
}

function parseMobileMapping(value: unknown): MobileGroupScrollMapping | null {
  const record = asRecord(value)

  if (!record) {
    return null
  }

  const startProgress = toFiniteNumber(record.startProgress)
  const endProgress = toFiniteNumber(record.endProgress)
  const translateX = toFiniteNumber(record.translateX)
  const translateY = toFiniteNumber(record.translateY)
  const scaleFrom = toFiniteNumber(record.scaleFrom)
  const scaleTo = toFiniteNumber(record.scaleTo)
  const opacityFrom = toFiniteNumber(record.opacityFrom)
  const opacityTo = toFiniteNumber(record.opacityTo)
  const speedMultiplier = toFiniteNumber(record.speedMultiplier)
  const easing = toEasingKey(record.easing)

  if (
    startProgress === null ||
    endProgress === null ||
    translateX === null ||
    translateY === null ||
    scaleFrom === null ||
    scaleTo === null ||
    opacityFrom === null ||
    opacityTo === null ||
    speedMultiplier === null ||
    easing === null
  ) {
    return null
  }

  return {
    startProgress,
    endProgress,
    translateX,
    translateY,
    scaleFrom,
    scaleTo,
    opacityFrom,
    opacityTo,
    speedMultiplier,
    easing,
  }
}

function parseGrouping(value: unknown): SceneGroupingConfig | null {
  const record = asRecord(value)

  if (!record || record.version !== 1 || !Array.isArray(record.groups)) {
    return null
  }

  const groups = record.groups
    .map((group): SceneGroupConfig | null => {
      const groupRecord = asRecord(group)

      if (!groupRecord || !Array.isArray(groupRecord.layerIndexes)) {
        return null
      }

      const groupKey = toGroupKey(groupRecord.groupKey)
      const mobile = parseMobileMapping(groupRecord.mobile)
      const layerIndexes = groupRecord.layerIndexes.map((item) => toLayerIndex(item)).filter((item): item is number => item !== null)

      if (!groupKey || !mobile || layerIndexes.length !== groupRecord.layerIndexes.length) {
        return null
      }

      return {
        groupKey,
        layerIndexes,
        mobile,
      }
    })
    .filter((group): group is SceneGroupConfig => group !== null)

  return groups.length > 0 ? { version: 1, groups } : null
}

function deriveVariantScale(value: number, factor: number) {
  return round(1 + (value - 1) * factor)
}

function deriveTabletMapping(mobile: MobileGroupScrollMapping): MobileGroupScrollMapping {
  return {
    ...mobile,
    translateX: round(mobile.translateX * 1.2),
    translateY: round(mobile.translateY * 1.2),
    scaleFrom: deriveVariantScale(mobile.scaleFrom, 1.08),
    scaleTo: deriveVariantScale(mobile.scaleTo, 1.08),
    speedMultiplier: round(mobile.speedMultiplier * 1.15),
  }
}

function deriveDesktopMapping(mobile: MobileGroupScrollMapping): MobileGroupScrollMapping {
  return {
    ...mobile,
    translateX: round(mobile.translateX * 1.4),
    translateY: round(mobile.translateY * 1.4),
    scaleFrom: deriveVariantScale(mobile.scaleFrom, 1.15),
    scaleTo: deriveVariantScale(mobile.scaleTo, 1.15),
    speedMultiplier: round(mobile.speedMultiplier * 1.3),
  }
}

function resolveDepthScore(asset: { layerOrder: number | null; metadataJson?: unknown }) {
  const metadata = asRecord(asset.metadataJson)

  if (!metadata) {
    return asset.layerOrder ?? 0
  }

  const score =
    toFiniteNumber(metadata.depth) ??
    toFiniteNumber(metadata.depthScore) ??
    toFiniteNumber(metadata.zDepth) ??
    toFiniteNumber(metadata.distanceFromCamera) ??
    toFiniteNumber(metadata.distance)

  return score ?? asset.layerOrder ?? 0
}

function splitIndexIntoGroup(position: number, total: number): GroupKey {
  if (total <= 1) {
    return "midground"
  }

  const ratio = position / Math.max(total - 1, 1)
  if (ratio <= 0.33) {
    return "background"
  }
  if (ratio >= 0.66) {
    return "foreground"
  }
  return "midground"
}

function buildDefaultGrouping(layerAssets: Array<{ layerOrder: number | null; metadataJson?: unknown }>): SceneGroupingConfig | null {
  if (layerAssets.length === 0) {
    return null
  }

  const buckets: Record<GroupKey, number[]> = {
    background: [],
    midground: [],
    foreground: [],
  }

  const rankedLayers = [...layerAssets]
    .map((asset, index) => ({
      layerIndex: asset.layerOrder ?? index,
      depthScore: resolveDepthScore(asset),
    }))
    .sort((left, right) => left.depthScore - right.depthScore)

  rankedLayers.forEach((layer, position) => {
    buckets[splitIndexIntoGroup(position, rankedLayers.length)].push(layer.layerIndex)
  })

  return {
    version: 1,
    groups: GROUP_KEYS.map((groupKey) => ({
      groupKey,
      layerIndexes: buckets[groupKey],
      mobile: GROUP_DEFAULTS[groupKey],
    })),
  }
}

function mergeGroupingWithDefaults(
  grouping: SceneGroupingConfig | null,
  layerAssets: Array<{ layerOrder: number | null; metadataJson?: unknown }>,
): SceneGroupingConfig | null {
  const fallbackGrouping = buildDefaultGrouping(layerAssets)

  if (!grouping) {
    return fallbackGrouping
  }

  const assignedLayerIndexes = new Set(grouping.groups.flatMap((group) => group.layerIndexes))
  const unassignedLayerIndexes = layerAssets
    .map((asset, index) => asset.layerOrder ?? index)
    .filter((layerIndex) => !assignedLayerIndexes.has(layerIndex))

  return {
    version: 1,
    groups: GROUP_KEYS.map((groupKey) => {
      const existingGroup = grouping.groups.find((group) => group.groupKey === groupKey)

      if (existingGroup) {
        return {
          ...existingGroup,
          layerIndexes:
            groupKey === "midground" ? [...existingGroup.layerIndexes, ...unassignedLayerIndexes] : existingGroup.layerIndexes,
        }
      }

      return {
        groupKey,
        layerIndexes: groupKey === "midground" ? unassignedLayerIndexes : [],
        mobile: fallbackGrouping?.groups.find((group) => group.groupKey === groupKey)?.mobile ?? GROUP_DEFAULTS[groupKey],
      }
    }),
  }
}

function buildLayerBehavior(groupKey: GroupKey, layerIndex: number, mobile: MobileGroupScrollMapping, intensityBase: number): MotionLayerBehavior {
  const tablet = deriveTabletMapping(mobile)
  const desktop = deriveDesktopMapping(mobile)

  return {
    layerIndex,
    parallax: round(GROUP_PARALLAX_WEIGHT[groupKey] * intensityBase * mobile.speedMultiplier),
    scale: round(mobile.scaleTo),
    opacity: round(mobile.opacityTo),
    groupKey,
    startProgress: mobile.startProgress,
    endProgress: mobile.endProgress,
    translateX: mobile.translateX,
    translateY: mobile.translateY,
    scaleFrom: mobile.scaleFrom,
    scaleTo: mobile.scaleTo,
    opacityFrom: mobile.opacityFrom,
    opacityTo: mobile.opacityTo,
    speedMultiplier: mobile.speedMultiplier,
    easing: mobile.easing,
    mobile,
    tablet,
    desktop,
  }
}

export const motionService = {
  deriveTabletMapping,

  deriveDesktopMapping,

  buildBlueprint(scene: {
    assets: Array<{ assetType: string; layerOrder: number | null; metadataJson?: unknown }>
    motionPreset?: string | null
    motionIntensity?: string | null
    framingData?: unknown
  }): MotionBlueprint {
    const intensity = intensityFromPreset(scene.motionIntensity ?? scene.motionPreset)
    const layerAssets = scene.assets.filter((asset) => asset.assetType === "layer")
    const denominator = Math.max(layerAssets.length, 1)
    const baseMultiplier = intensity === "low" ? 0.55 : intensity === "high" ? 1.25 : 0.85
    const grouping = mergeGroupingWithDefaults(parseGrouping(scene.framingData), layerAssets)

    const groupedLayerBehaviors = grouping?.groups.flatMap((group) =>
      group.layerIndexes.map((layerIndex) => buildLayerBehavior(group.groupKey, layerIndex, group.mobile, baseMultiplier)),
    )

    return {
      cameraMovement: movementFromPreset(scene.motionPreset),
      intensity,
      layerBehaviors:
        groupedLayerBehaviors && groupedLayerBehaviors.length > 0
          ? groupedLayerBehaviors
          : layerAssets.map((asset, index) => ({
              layerIndex: asset.layerOrder ?? index,
              parallax: round(((index + 1) / denominator) * baseMultiplier),
              scale: round(1 + (index / denominator) * 0.08 * baseMultiplier),
              opacity: round(1 - index * 0.04),
            })),
      transition: {
        overlapMs: DEFAULT_SCENE_OVERLAP_MS,
        easing: intensity === "high" ? "linear" : "ease-out",
      },
      reducedMotion: {
        cameraMovement: "hold",
        multiplier: 0.2,
      },
    }
  },

  async generateForScene(scene: {
    id: string
    projectId: string
    assets: Array<{ assetType: string; layerOrder: number | null; metadataJson?: unknown }>
    motionPreset?: string | null
    motionIntensity?: string | null
    framingData?: unknown
  }, traceId?: string | null) {
    const startedAt = Date.now()
    const blueprint = this.buildBlueprint(scene)

    const updatedScene = await sceneRepository.setMotionBlueprint(scene.id, blueprint as Prisma.InputJsonValue)

    metrics.observe("processing_motion_duration_ms", Date.now() - startedAt)
    logProcessingEvent({
      event: "motion blueprint generated",
      traceId,
      projectId: scene.projectId,
      sceneId: scene.id,
      details: {
        layerCount: blueprint.layerBehaviors.length,
        intensity: blueprint.intensity,
      },
    })

    return updatedScene
  },
}
