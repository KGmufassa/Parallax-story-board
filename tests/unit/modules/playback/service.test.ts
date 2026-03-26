import { SceneStatus } from "@prisma/client"
import { beforeEach, describe, expect, it } from "vitest"

import { resetEnvCache } from "@/config/env"
import { playbackService } from "@/modules/playback"

describe("playbackService", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/parallax_story_composer"
    process.env.NEXTAUTH_SECRET = "test-secret"
    process.env.NEXTAUTH_URL = "http://localhost:3000"
    process.env.GUEST_SESSION_TTL_HOURS = "72"
    process.env.RATE_LIMIT_WINDOW_MS = "60000"
    process.env.RATE_LIMIT_MAX_REQUESTS = "60"
    process.env.LOG_LEVEL = "info"
    Object.assign(process.env, { NODE_ENV: "test" })
    process.env.UPLOAD_MAX_FILES = "10"
    process.env.UPLOAD_MAX_FILE_SIZE_BYTES = "10485760"
    process.env.UPLOAD_ALLOWED_MIME_TYPES = "image/jpeg,image/png,image/webp"
    process.env.INTERNAL_UPLOAD_TOKEN_SECRET = "test-upload-secret"
    process.env.QWEN_MODEL = "qwen-image-layered"
    process.env.QWEN_TIMEOUT_MS = "30000"
    process.env.QWEN_MAX_RETRIES = "2"
    process.env.QWEN_MOCK_MODE = "true"
    process.env.GUEST_MAX_PROJECTS = "3"
    process.env.GUEST_MAX_SCENES_PER_PROJECT = "10"
    process.env.PROCESSING_JOB_TIMEOUT_MS = "300000"
    process.env.FEATURE_MOTION_PIPELINE = "true"
    process.env.FEATURE_PLAYBACK_PIPELINE = "true"
    process.env.FEATURE_PREVIEW_FALLBACKS = "true"
    process.env.FEATURE_REDUCED_MOTION_PREVIEW = "true"
    process.env.PROCESSING_CANARY_PERCENT = "100"
    resetEnvCache()
  })

  it("builds fallback timeline from ready scenes only", () => {
    const timeline = playbackService.buildTimeline(
      "project-1",
      [
        {
          id: "scene-ready",
          orderIndex: 0,
          status: SceneStatus.ready,
          thumbnailUrl: "thumb-ready",
          sourceImageUrl: "source-ready",
          motionIntensity: "medium",
          motionBlueprintJson: {
            cameraMovement: "drift-up",
            intensity: "medium",
            layerBehaviors: [{
              layerIndex: 0,
              groupKey: "background",
              parallax: 0.5,
              scale: 1.03,
              opacity: 1,
              mobile: {
                startProgress: 0,
                endProgress: 1,
                translateX: 0,
                translateY: -18,
                scaleFrom: 1,
                scaleTo: 1.03,
                opacityFrom: 1,
                opacityTo: 1,
                speedMultiplier: 0.8,
                easing: "ease-out",
              },
            }],
            transition: { overlapMs: 320, easing: "ease-out" },
            reducedMotion: { cameraMovement: "hold", multiplier: 0.2 },
          },
        },
        {
          id: "scene-failed",
          orderIndex: 1,
          status: SceneStatus.failed,
          thumbnailUrl: "thumb-failed",
          sourceImageUrl: "source-failed",
          motionIntensity: "medium",
          motionBlueprintJson: null,
        },
      ],
      { allowFallback: true },
    )

    expect(timeline.summary.totalScenes).toBe(2)
    expect(timeline.summary.renderableScenes).toBe(1)
    expect(timeline.isFallback).toBe(true)
    expect(timeline.scenes[0]?.layerBehaviors[0]).toMatchObject({
      groupKey: "background",
      mobile: {
        translateY: -18,
      },
    })
  })

  it("applies reduced motion multiplier", () => {
    const timeline = playbackService.buildTimeline(
      "project-1",
      [
        {
          id: "scene-ready",
          orderIndex: 0,
          status: SceneStatus.ready,
          thumbnailUrl: "thumb-ready",
          sourceImageUrl: "source-ready",
          motionIntensity: "high",
          motionBlueprintJson: {
            cameraMovement: "push-in",
            intensity: "high",
            layerBehaviors: [{
              layerIndex: 0,
              parallax: 0.8,
              scale: 1.08,
              opacity: 1,
              translateX: 10,
              translateY: -30,
              scaleFrom: 1,
              scaleTo: 1.12,
              speedMultiplier: 1.2,
              mobile: {
                startProgress: 0,
                endProgress: 1,
                translateX: 10,
                translateY: -30,
                scaleFrom: 1,
                scaleTo: 1.12,
                opacityFrom: 1,
                opacityTo: 1,
                speedMultiplier: 1.2,
                easing: "linear",
              },
            }],
            transition: { overlapMs: 320, easing: "linear" },
            reducedMotion: { cameraMovement: "hold", multiplier: 0.2 },
          },
        },
      ],
      { reducedMotion: true, allowFallback: true },
    )

    expect(timeline.reducedMotion).toBe(true)
    expect(timeline.scenes[0]?.cameraMovement).toBe("hold")
    expect(timeline.scenes[0]?.layerBehaviors[0]?.parallax).toBe(0.16)
    expect(timeline.scenes[0]?.layerBehaviors[0]?.mobile).toMatchObject({
      translateX: 2,
      translateY: -6,
      scaleTo: 1.024,
      speedMultiplier: 0.24,
    })
  })

  it("rejects playback when no scenes are renderable", () => {
    expect(() =>
      playbackService.buildTimeline(
        "project-1",
        [
          {
            id: "scene-failed",
            orderIndex: 0,
            status: SceneStatus.failed,
            thumbnailUrl: "thumb-failed",
            sourceImageUrl: "source-failed",
            motionIntensity: "medium",
            motionBlueprintJson: null,
          },
        ],
        { allowFallback: true },
      ),
    ).toThrow(/no scenes are ready for playback yet/i)
  })
})
