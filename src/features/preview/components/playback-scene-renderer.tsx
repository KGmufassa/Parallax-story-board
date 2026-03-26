import type { CSSProperties } from "react"

import type { NormalizedPlaybackScene } from "@/features/preview/lib/playback-client"

type PlaybackSceneRendererProps = {
  scene: NormalizedPlaybackScene
  isReducedMotion?: boolean
  className?: string
  progress?: number
}

type PlaybackLayerStyle = CSSProperties & {
  "--playback-offset-x": string
  "--playback-offset-y": string
  "--playback-scale": string
  "--playback-opacity": string
}

function clampProgress(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null
  }

  return Math.min(1, Math.max(0, value))
}

function applyEasing(progress: number, easing: string | undefined) {
  if (easing === "ease-out") {
    return 1 - (1 - progress) * (1 - progress)
  }

  if (easing === "ease-in-out") {
    return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
  }

  return progress
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

function toGroupedProgress(progress: number, startProgress: number, endProgress: number) {
  if (endProgress <= startProgress) {
    return progress >= endProgress ? 1 : 0
  }

  const ratio = (progress - startProgress) / (endProgress - startProgress)
  return Math.min(1, Math.max(0, ratio))
}

function toOffset(cameraMovement: string, parallax: number, index: number) {
  const distance = Number((parallax * 48 + index * 4).toFixed(1))

  if (cameraMovement.includes("push")) {
    return { x: 0, y: -distance * 0.65 }
  }

  if (cameraMovement.includes("right")) {
    return { x: distance * 0.7, y: 0 }
  }

  if (cameraMovement.includes("hold")) {
    return { x: 0, y: 0 }
  }

  return { x: 0, y: -distance }
}

function toFlatImageTransform(cameraMovement: string, progress: number, isReducedMotion: boolean) {
  const dampedProgress = isReducedMotion ? progress * 0.18 : progress
  const drift = Number((dampedProgress * 18).toFixed(1))
  const pushScale = Number((1.02 + dampedProgress * (isReducedMotion ? 0.015 : 0.05)).toFixed(3))

  if (cameraMovement.includes("push")) {
    return `translate3d(0, ${(-drift * 0.45).toFixed(1)}px, 0) scale(${pushScale})`
  }

  if (cameraMovement.includes("right")) {
    return `translate3d(${(drift * 0.7).toFixed(1)}px, 0, 0) scale(1.02)`
  }

  if (cameraMovement.includes("hold")) {
    return "translate3d(0, 0, 0) scale(1.01)"
  }

  return `translate3d(0, ${(-drift).toFixed(1)}px, 0) scale(1.03)`
}

export function PlaybackSceneRenderer({ scene, isReducedMotion = false, className, progress }: PlaybackSceneRendererProps) {
  const layerAssets = scene.layerAssets.length > 0 ? scene.layerAssets : []
  const shouldRenderLayers = layerAssets.length > 0 && scene.layerBehaviors.length > 0
  const normalizedProgress = clampProgress(progress)
  const isInteractive = normalizedProgress !== null
  const flatImageStyle = scene.imageUrl
    ? {
        backgroundImage: `url("${scene.imageUrl}")`,
        transform: isInteractive ? toFlatImageTransform(scene.cameraMovement, normalizedProgress, isReducedMotion) : undefined,
      }
    : undefined

  return (
    <div className={["playback-scene-renderer", isInteractive ? "playback-scene-renderer--interactive" : null, className].filter(Boolean).join(" ")}>
      {scene.imageUrl ? (
        <div className="playback-scene-renderer__flat" style={flatImageStyle} />
      ) : (
        <div className="playback-scene-renderer__flat playback-scene-renderer__flat--placeholder">
          <div>
            <strong>Image unavailable</strong>
            <span>This scene can stay previewable while generated assets catch up.</span>
          </div>
        </div>
      )}

      {shouldRenderLayers
        ? layerAssets.map((layer, index) => {
            const behavior = scene.layerBehaviors.find((item) => item.layerIndex === layer.layerOrder) ?? scene.layerBehaviors[index]
            const groupedMapping = behavior?.mobile
            const hasGroupedMotion = Boolean(
              groupedMapping &&
              typeof groupedMapping.startProgress === "number" &&
              typeof groupedMapping.endProgress === "number",
            )
            const activeGroupedMapping = hasGroupedMotion ? groupedMapping! : null
            const groupedProgress = isInteractive && hasGroupedMotion
              ? applyEasing(
                  toGroupedProgress(normalizedProgress, activeGroupedMapping?.startProgress ?? 0, activeGroupedMapping?.endProgress ?? 1),
                  activeGroupedMapping?.easing,
                )
              : 0
            const parallax = isReducedMotion ? (behavior?.parallax ?? 0.18) * 0.18 : behavior?.parallax ?? 0.18
            const progressMultiplier = isInteractive ? normalizedProgress - 0.5 : 1
            const fallbackOffset = toOffset(scene.cameraMovement, parallax * (isInteractive ? progressMultiplier * 2 : 1), index)
            const offset = hasGroupedMotion
              ? {
                  x: interpolate(0, activeGroupedMapping?.translateX ?? 0, groupedProgress),
                  y: interpolate(0, activeGroupedMapping?.translateY ?? 0, groupedProgress),
                }
              : fallbackOffset
            const baseScale = isReducedMotion ? 1 : behavior?.scale ?? 1
            const interactiveScale = hasGroupedMotion
              ? interpolate(activeGroupedMapping?.scaleFrom ?? 1, activeGroupedMapping?.scaleTo ?? 1, groupedProgress)
              : isInteractive
                ? 1 + (baseScale - 1) * normalizedProgress
                : baseScale
            const interactiveOpacity = hasGroupedMotion
              ? interpolate(activeGroupedMapping?.opacityFrom ?? 1, activeGroupedMapping?.opacityTo ?? 1, groupedProgress)
              : isInteractive
                ? Math.min(1, Math.max(0.36, (behavior?.opacity ?? Math.max(0.45, 1 - index * 0.08)) - (0.5 - normalizedProgress) * 0.08))
                : behavior?.opacity ?? Math.max(0.45, 1 - index * 0.08)
            const style: PlaybackLayerStyle = {
              backgroundImage: `url("${layer.assetUrl}")`,
              zIndex: String(10 + index),
              "--playback-offset-x": `${offset.x}px`,
              "--playback-offset-y": `${offset.y}px`,
              "--playback-scale": `${interactiveScale}`,
              "--playback-opacity": `${interactiveOpacity}`,
            }

            return <div className="playback-scene-renderer__layer" key={`${scene.id}-${layer.layerOrder}-${index}`} style={style} />
          })
        : null}

      <div className="playback-scene-renderer__overlay" />
    </div>
  )
}
