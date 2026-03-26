import { beforeEach, describe, expect, it } from "vitest"

import { resetEnvCache } from "@/config/env"
import { uploadService } from "@/modules/uploads"

describe("uploadService", () => {
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
    resetEnvCache()
  })

  it("creates and verifies upload contracts", () => {
    const [contract] = uploadService.createUploadContracts("project-1", [
      {
        filename: "scene.png",
        mimeType: "image/png",
        sizeBytes: 1024,
      },
    ])

    const verified = uploadService.verifyUploadToken(contract.uploadToken)

    expect(verified.projectId).toBe("project-1")
    expect(verified.storageKey).toContain("projects/project-1/incoming/")
    expect(contract.uploadUrl).toContain(contract.uploadToken)
  })

  it("rejects unsupported mime types", () => {
    expect(() =>
      uploadService.createUploadContracts("project-1", [
        {
          filename: "scene.gif",
          mimeType: "image/gif",
          sizeBytes: 1024,
        },
      ]),
    ).toThrow(/unsupported file type/i)
  })
})
