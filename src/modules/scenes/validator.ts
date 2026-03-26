import { z } from "zod"

const GROUP_KEYS = ["background", "midground", "foreground"] as const
const EASING_KEYS = ["linear", "ease-out", "ease-in-out"] as const

const boundedNumber = (min: number, max: number) => z.number().finite().min(min).max(max)

const mobileGroupScrollMappingSchema = z.object({
  startProgress: boundedNumber(0, 1),
  endProgress: boundedNumber(0, 1),
  translateX: boundedNumber(-1000, 1000),
  translateY: boundedNumber(-1000, 1000),
  scaleFrom: boundedNumber(0.1, 3),
  scaleTo: boundedNumber(0.1, 3),
  opacityFrom: boundedNumber(0, 1),
  opacityTo: boundedNumber(0, 1),
  speedMultiplier: boundedNumber(0, 5),
  easing: z.enum(EASING_KEYS),
}).refine((value) => value.startProgress <= value.endProgress, {
  message: "startProgress must be less than or equal to endProgress",
  path: ["endProgress"],
})

const sceneGroupConfigSchema = z.object({
  groupKey: z.enum(GROUP_KEYS),
  layerIndexes: z.array(z.number().int().min(0)).max(100),
  mobile: mobileGroupScrollMappingSchema,
})

const sceneGroupingConfigSchema = z.object({
  version: z.literal(1),
  groups: z.array(sceneGroupConfigSchema).max(3),
}).superRefine((value, ctx) => {
  const seenGroups = new Set<string>()
  const seenLayerIndexes = new Map<number, number>()

  value.groups.forEach((group, groupIndex) => {
    if (seenGroups.has(group.groupKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate groupKey: ${group.groupKey}`,
        path: ["groups", groupIndex, "groupKey"],
      })
    }

    seenGroups.add(group.groupKey)

    group.layerIndexes.forEach((layerIndex, layerIndexPosition) => {
      if (seenLayerIndexes.has(layerIndex)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Layer ${layerIndex} is assigned to multiple groups`,
          path: ["groups", groupIndex, "layerIndexes", layerIndexPosition],
        })
        return
      }

      seenLayerIndexes.set(layerIndex, groupIndex)
    })
  })
})

export const updateSceneInputSchema = z.object({
  contextText: z.string().trim().max(4000).nullable().optional(),
  motionPreset: z.string().trim().max(120).nullable().optional(),
  motionIntensity: z.string().trim().max(120).nullable().optional(),
  grouping: sceneGroupingConfigSchema.nullable().optional(),
})

export const finalizeUploadsInputSchema = z.object({
  uploads: z.array(
    z.object({
      uploadToken: z.string().min(1),
      originalFilename: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(1),
      sizeBytes: z.number().int().positive(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      contextText: z.string().trim().max(4000).nullish(),
      motionPreset: z.string().trim().max(120).nullish(),
      motionIntensity: z.string().trim().max(120).nullish(),
    }),
  ).min(1),
})

export const sceneReprocessInputSchema = z.object({
  reason: z.string().trim().max(255).optional(),
})
