import { describe, expect, it } from "vitest"

import { buildNormalizedPlaybackState } from "@/features/preview/lib/playback-client"

describe("buildNormalizedPlaybackState", () => {
  it("prefers stitched playback scenes while reusing project layer assets", () => {
    const state = buildNormalizedPlaybackState(
      {
        id: "project-1",
        title: "Doc Alignment",
        status: "draft",
        scenes: [
          {
            id: "scene-1",
            orderIndex: 0,
            status: "ready",
            contextText: "Opening frame",
            sourceImageUrl: "/api/v1/assets/projects/project-1/scenes/scene-1/source.png",
            thumbnailUrl: "/api/v1/assets/projects/project-1/scenes/scene-1/thumb.png",
            assets: [
              {
                assetUrl: "/api/v1/assets/projects/project-1/scenes/scene-1/layers/0.png",
                assetType: "layer",
                layerOrder: 0,
              },
              {
                assetUrl: "/api/v1/assets/projects/project-1/scenes/scene-1/layers/1.png",
                assetType: "layer",
                layerOrder: 1,
              },
            ],
          },
        ],
      },
      {
        version: 3,
        isFallback: false,
        isReducedMotion: true,
        timelineJson: {
          summary: {
            totalDurationMs: 2400,
          },
          scenes: [
            {
              sceneId: "scene-1",
              orderIndex: 0,
              status: "ready",
              sourceImageUrl: null,
              thumbnailUrl: "/api/v1/assets/projects/project-1/scenes/scene-1/playback.png",
              fallback: false,
              startsAtMs: 0,
              durationMs: 2400,
              cameraMovement: "hold",
              intensity: "low",
              layerBehaviors: [{ layerIndex: 0, parallax: 0.14, scale: 1.01, opacity: 1 }],
            },
          ],
        },
      },
    )

    expect(state.playbackVersion).toBe(3)
    expect(state.isReducedMotion).toBe(true)
    expect(state.totalDurationMs).toBe(2400)
    expect(state.scenes[0]?.imageUrl).toContain("playback.png")
    expect(state.scenes[0]?.layerAssets).toHaveLength(2)
    expect(state.scenes[0]?.detail).toBe("Opening frame")
  })

  it("falls back to project scenes when playback is unavailable", () => {
    const state = buildNormalizedPlaybackState(
      {
        id: "project-2",
        title: "Fallback Project",
        status: "processing",
        scenes: [
          {
            id: "scene-2",
            orderIndex: 1,
            status: "processing",
            contextText: null,
            sourceImageUrl: null,
            thumbnailUrl: "/api/v1/assets/projects/project-2/scenes/scene-2/thumb.png",
            assets: [],
          },
        ],
      },
      null,
    )

    expect(state.playbackVersion).toBeNull()
    expect(state.projectStatus).toBe("processing")
    expect(state.scenes[0]?.title).toBe("Scene 01")
    expect(state.scenes[0]?.imageUrl).toContain("thumb.png")
    expect(state.totalDurationMs).toBe(2200)
  })
})
