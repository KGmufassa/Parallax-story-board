export type GroupKey = "background" | "midground" | "foreground"

export type EasingKey = "linear" | "ease-out" | "ease-in-out"

export type MobileGroupScrollMapping = {
  startProgress: number
  endProgress: number
  translateX: number
  translateY: number
  scaleFrom: number
  scaleTo: number
  opacityFrom: number
  opacityTo: number
  speedMultiplier: number
  easing: EasingKey
}

export type SceneGroupConfig = {
  groupKey: GroupKey
  layerIndexes: number[]
  mobile: MobileGroupScrollMapping
}

export type SceneGroupingConfig = {
  version: 1
  groups: SceneGroupConfig[]
}

export type UpdateSceneInput = {
  contextText?: string | null
  motionPreset?: string | null
  motionIntensity?: string | null
  grouping?: SceneGroupingConfig | null
}

export type FinalizeUploadSceneInput = {
  uploadToken: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  contextText?: string | null
  motionPreset?: string | null
  motionIntensity?: string | null
}
