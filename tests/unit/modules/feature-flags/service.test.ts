import { beforeEach, describe, expect, it } from "vitest"

import { resetEnvCache } from "@/config/env"
import { featureFlagService } from "@/modules/feature-flags"

describe("featureFlagService", () => {
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
    process.env.PROCESSING_CANARY_PERCENT = "20"
    resetEnvCache()
  })

  it("returns deterministic canary decisions", () => {
    expect(featureFlagService.allowsProcessing("scene-a")).toBe(featureFlagService.allowsProcessing("scene-a"))
  })

  it("returns configured flags", () => {
    expect(featureFlagService.flags().processingCanaryPercent).toBe(20)
    expect(featureFlagService.flags().motionPipeline).toBe(true)
  })
})
