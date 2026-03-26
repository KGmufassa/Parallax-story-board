import type { PlaybackPlan, Project, Scene, SceneAsset } from "@prisma/client"

import { toPublicAssetUrl } from "@/modules/assets/storage"

type SceneWithAssets = Scene & {
  assets?: SceneAsset[]
}

type ProjectWithScenes = Project & {
  scenes?: SceneWithAssets[]
}

function serializeSceneAsset<T extends SceneAsset>(asset: T) {
  return {
    ...asset,
    assetUrl: toPublicAssetUrl(asset.assetUrl) ?? asset.assetUrl,
  }
}

export function serializeScene<T extends SceneWithAssets>(scene: T) {
  return {
    ...scene,
    sourceImageUrl: toPublicAssetUrl(scene.sourceImageUrl),
    thumbnailUrl: toPublicAssetUrl(scene.thumbnailUrl),
    assets: Array.isArray(scene.assets) ? scene.assets.map((asset) => serializeSceneAsset(asset)) : scene.assets,
  }
}

export function serializeProject<T extends ProjectWithScenes>(project: T) {
  return {
    ...project,
    scenes: Array.isArray(project.scenes) ? project.scenes.map((scene) => serializeScene(scene)) : project.scenes,
  }
}

export function serializeProjects<T extends ProjectWithScenes>(projects: T[]) {
  return projects.map((project) => serializeProject(project))
}

export function serializePlaybackPlan<T extends PlaybackPlan>(plan: T) {
  const timelineJson = typeof plan.timelineJson === "object" && plan.timelineJson ? plan.timelineJson as Record<string, unknown> : null
  const scenes = Array.isArray(timelineJson?.scenes) ? timelineJson.scenes : []

  return {
    ...plan,
    timelineJson: timelineJson
      ? {
          ...timelineJson,
          scenes: scenes.map((scene) => {
            if (!scene || typeof scene !== "object") {
              return scene
            }

            const record = scene as Record<string, unknown>
            return {
              ...record,
              sourceImageUrl: typeof record.sourceImageUrl === "string" ? toPublicAssetUrl(record.sourceImageUrl) : record.sourceImageUrl,
              thumbnailUrl: typeof record.thumbnailUrl === "string" ? toPublicAssetUrl(record.thumbnailUrl) : record.thumbnailUrl,
            }
          }),
        }
      : plan.timelineJson,
  }
}
