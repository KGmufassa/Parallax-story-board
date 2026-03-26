import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  LOCAL_STORAGE_ROOT: z.string().min(1).default(".local/storage"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GUEST_SESSION_COOKIE_NAME: z.string().min(1).default("psc_guest_session"),
  GUEST_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(72),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
  UPLOAD_MAX_FILES: z.coerce.number().int().positive().max(20).default(10),
  UPLOAD_MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10_485_760),
  UPLOAD_ALLOWED_MIME_TYPES: z
    .string()
    .transform((value) => value.split(",").map((entry) => entry.trim()).filter(Boolean))
    .default("image/jpeg,image/png,image/webp"),
  INTERNAL_UPLOAD_TOKEN_SECRET: z.string().min(1, "INTERNAL_UPLOAD_TOKEN_SECRET is required"),
  INTERNAL_MAINTENANCE_TOKEN: z.string().optional().default(""),
  QWEN_API_URL: z.string().optional().default(""),
  QWEN_API_KEY: z.string().optional().default(""),
  QWEN_MODEL: z.string().min(1).default("qwen-image-layered"),
  QWEN_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  QWEN_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
  QWEN_MOCK_MODE: z.coerce.boolean().default(true),
  GUEST_MAX_PROJECTS: z.coerce.number().int().positive().default(3),
  GUEST_MAX_SCENES_PER_PROJECT: z.coerce.number().int().positive().default(10),
  PROCESSING_JOB_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
  FEATURE_MOTION_PIPELINE: z.coerce.boolean().default(true),
  FEATURE_PLAYBACK_PIPELINE: z.coerce.boolean().default(true),
  FEATURE_PREVIEW_FALLBACKS: z.coerce.boolean().default(true),
  FEATURE_REDUCED_MOTION_PREVIEW: z.coerce.boolean().default(true),
  PROCESSING_CANARY_PERCENT: z.coerce.number().int().min(0).max(100).default(100),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

export type AppEnv = z.infer<typeof envSchema>

let cachedEnv: AppEnv | null = null

export function resetEnvCache() {
  cachedEnv = null
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    throw new Error(`Invalid environment configuration: ${issues.join(", ")}`)
  }

  cachedEnv = parsed.data
  return cachedEnv
}

export function envIsConfigured(): boolean {
  return envSchema.safeParse(process.env).success
}

export function getAuthConfigEnv() {
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET must be configured in production.")
    }
  }

  const hasGoogleClientId = Boolean(process.env.GOOGLE_CLIENT_ID)
  const hasGoogleClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET)

  if (hasGoogleClientId !== hasGoogleClientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be configured to enable Google auth.")
  }

  return {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "development-nextauth-secret",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  }
}
