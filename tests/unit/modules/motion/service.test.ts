import { describe, expect, it } from "vitest"

import { motionService } from "@/modules/motion"

describe("motionService", () => {
  it("expands grouped config into layer behaviors", () => {
    const blueprint = motionService.buildBlueprint({
      motionPreset: "push dramatic",
      motionIntensity: "high",
      framingData: {
        version: 1,
        groups: [
          {
            groupKey: "background",
            layerIndexes: [0],
            mobile: {
              startProgress: 0,
              endProgress: 0.9,
              translateX: -4,
              translateY: -18,
              scaleFrom: 1,
              scaleTo: 1.05,
              opacityFrom: 1,
              opacityTo: 0.9,
              speedMultiplier: 0.8,
              easing: "ease-out",
            },
          },
          {
            groupKey: "foreground",
            layerIndexes: [1, 2],
            mobile: {
              startProgress: 0.1,
              endProgress: 1,
              translateX: 14,
              translateY: -42,
              scaleFrom: 1,
              scaleTo: 1.18,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 1.25,
              easing: "ease-in-out",
            },
          },
        ],
      },
      assets: [
        { assetType: "layer", layerOrder: 0 },
        { assetType: "layer", layerOrder: 1 },
        { assetType: "layer", layerOrder: 2 },
      ],
    })

    expect(blueprint.cameraMovement).toBe("push-in")
    expect(blueprint.intensity).toBe("high")
    expect(blueprint.layerBehaviors).toHaveLength(3)
    expect(blueprint.layerBehaviors[0]).toMatchObject({
      groupKey: "background",
      startProgress: 0,
      endProgress: 0.9,
    })
    expect(blueprint.transition.overlapMs).toBeGreaterThan(0)
  })

  it("derives tablet and desktop mappings from mobile", () => {
    const mobile = {
      startProgress: 0,
      endProgress: 1,
      translateX: 10,
      translateY: -20,
      scaleFrom: 1,
      scaleTo: 1.1,
      opacityFrom: 1,
      opacityTo: 1,
      speedMultiplier: 1,
      easing: "linear" as const,
    }

    expect(motionService.deriveTabletMapping(mobile)).toMatchObject({
      translateX: 12,
      translateY: -24,
      scaleTo: 1.108,
      speedMultiplier: 1.15,
    })

    expect(motionService.deriveDesktopMapping(mobile)).toMatchObject({
      translateX: 14,
      translateY: -28,
      scaleTo: 1.115,
      speedMultiplier: 1.3,
    })
  })

  it("keeps motion generation working when grouping is absent", () => {
    const blueprint = motionService.buildBlueprint({
      motionPreset: "drift up",
      motionIntensity: "medium",
      assets: [
        { assetType: "layer", layerOrder: 0 },
        { assetType: "layer", layerOrder: 1 },
      ],
    })

    expect(blueprint.layerBehaviors).toHaveLength(2)
    expect(blueprint.layerBehaviors.every((layer) => typeof layer.parallax === "number")).toBe(true)
  })

  it("auto-assigns default groups when grouping is absent", () => {
    const blueprint = motionService.buildBlueprint({
      motionPreset: "standard pan",
      motionIntensity: "medium",
      assets: [
        { assetType: "layer", layerOrder: 0 },
        { assetType: "layer", layerOrder: 1 },
        { assetType: "layer", layerOrder: 2 },
      ],
    })

    expect(blueprint.layerBehaviors.map((layer) => layer.groupKey)).toEqual(["background", "midground", "foreground"])
  })
})
