import type { EasingKey, GroupKey, MobileGroupScrollMapping } from "@/modules/scenes"

export type MotionDeviceMapping = MobileGroupScrollMapping

export type MotionLayerBehavior = {
  layerIndex: number
  parallax: number
  scale: number
  opacity: number
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
  mobile?: MotionDeviceMapping
  tablet?: MotionDeviceMapping
  desktop?: MotionDeviceMapping
}

export type MotionBlueprint = {
  cameraMovement: "drift-up" | "push-in" | "drift-right" | "hold"
  intensity: "low" | "medium" | "high"
  layerBehaviors: MotionLayerBehavior[]
  transition: {
    overlapMs: number
    easing: "ease-out" | "linear"
  }
  reducedMotion: {
    cameraMovement: "hold"
    multiplier: number
  }
}
