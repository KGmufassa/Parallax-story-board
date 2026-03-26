import { describe, expect, it } from "vitest"

import { updateSceneInputSchema } from "@/modules/scenes"

describe("updateSceneInputSchema", () => {
  it("accepts a valid grouped motion payload", () => {
    const result = updateSceneInputSchema.safeParse({
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "background",
            layerIndexes: [0, 1],
            mobile: {
              startProgress: 0,
              endProgress: 0.8,
              translateX: 0,
              translateY: -12,
              scaleFrom: 1,
              scaleTo: 1.08,
              opacityFrom: 1,
              opacityTo: 0.92,
              speedMultiplier: 0.8,
              easing: "ease-out",
            },
          },
          {
            groupKey: "midground",
            layerIndexes: [2],
            mobile: {
              startProgress: 0.1,
              endProgress: 0.95,
              translateX: 4,
              translateY: -24,
              scaleFrom: 1,
              scaleTo: 1.12,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 1,
              easing: "linear",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects duplicate layer assignments across groups", () => {
    const result = updateSceneInputSchema.safeParse({
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "background",
            layerIndexes: [0],
            mobile: {
              startProgress: 0,
              endProgress: 1,
              translateX: 0,
              translateY: 0,
              scaleFrom: 1,
              scaleTo: 1.1,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 0.8,
              easing: "linear",
            },
          },
          {
            groupKey: "foreground",
            layerIndexes: [0],
            mobile: {
              startProgress: 0,
              endProgress: 1,
              translateX: 12,
              translateY: -40,
              scaleFrom: 1,
              scaleTo: 1.2,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 1.2,
              easing: "ease-in-out",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/assigned to multiple groups/i)
  })

  it("rejects invalid groups", () => {
    const result = updateSceneInputSchema.safeParse({
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "sky",
            layerIndexes: [0],
            mobile: {
              startProgress: 0,
              endProgress: 1,
              translateX: 0,
              translateY: 0,
              scaleFrom: 1,
              scaleTo: 1,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 1,
              easing: "linear",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("rejects invalid progress ranges", () => {
    const result = updateSceneInputSchema.safeParse({
      grouping: {
        version: 1,
        groups: [
          {
            groupKey: "midground",
            layerIndexes: [1],
            mobile: {
              startProgress: 0.8,
              endProgress: 0.2,
              translateX: 0,
              translateY: 0,
              scaleFrom: 1,
              scaleTo: 1,
              opacityFrom: 1,
              opacityTo: 1,
              speedMultiplier: 1,
              easing: "linear",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/startProgress/i)
  })

  it("supports nullable grouping", () => {
    const result = updateSceneInputSchema.safeParse({
      grouping: null,
    })

    expect(result.success).toBe(true)
  })
})
