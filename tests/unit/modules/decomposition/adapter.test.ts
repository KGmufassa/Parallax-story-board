import { beforeEach, describe, expect, it } from "vitest"

import { resetEnvCache } from "@/config/env"
import { decompositionAdapter } from "@/modules/decomposition/adapter"

describe("decompositionAdapter", () => {
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
    resetEnvCache()
  })

  it("normalizes mock qwen output", async () => {
    const result = await decompositionAdapter.decompose({
      projectId: "project-1",
      sceneId: "scene-1",
      imageUrl: "projects/project-1/incoming/source.png",
      mimeType: "image/png",
      targetLayers: 4,
      correlationId: "corr-1",
    })

    expect(result.providerJobId).toContain("mock-")
    expect(result.layers).toHaveLength(4)
    expect(result.layers[0]?.metadata.source).toBe("qwen")
    expect(result.layers[0]?.artifact).toBeNull()
  })
})
