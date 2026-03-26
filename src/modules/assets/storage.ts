import { mkdir, readFile, stat, writeFile, copyFile } from "node:fs/promises"
import path from "node:path"

import { getEnv } from "@/config/env"
import { AppError } from "@/core/errors/app-error"

const ASSET_ROUTE_PREFIX = "/api/v1/assets"

function normalizeStorageKey(storageKey: string) {
  const normalized = storageKey.replace(/^\/+/, "")

  if (!normalized || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new AppError({
      code: "INVALID_ASSET_PATH",
      message: "Asset path is invalid.",
      statusCode: 400,
    })
  }

  return normalized
}

function absolutePathFor(storageKey: string) {
  const env = getEnv()
  const normalized = normalizeStorageKey(storageKey)
  const storageRoot = path.resolve(process.cwd(), env.LOCAL_STORAGE_ROOT)
  return path.join(storageRoot, normalized)
}

export function toPublicAssetUrl(storageKey: string | null | undefined) {
  if (!storageKey) {
    return null
  }

  if (storageKey.startsWith("http://") || storageKey.startsWith("https://") || storageKey.startsWith("/")) {
    return storageKey
  }

  return `${ASSET_ROUTE_PREFIX}/${normalizeStorageKey(storageKey)}`
}

export function toStorageKey(assetUrlOrPath: string) {
  if (assetUrlOrPath.startsWith(`${ASSET_ROUTE_PREFIX}/`)) {
    return normalizeStorageKey(assetUrlOrPath.slice(ASSET_ROUTE_PREFIX.length + 1))
  }

  return normalizeStorageKey(assetUrlOrPath)
}

export const assetStorageService = {
  toPublicAssetUrl,
  toStorageKey,

  async write(storageKey: string, content: Buffer | string) {
    const filePath = absolutePathFor(storageKey)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, content)
  },

  async copy(sourceStorageKey: string, targetStorageKey: string) {
    const sourcePath = absolutePathFor(sourceStorageKey)
    const targetPath = absolutePathFor(targetStorageKey)
    await mkdir(path.dirname(targetPath), { recursive: true })
    await copyFile(sourcePath, targetPath)
  },

  async read(storageKey: string) {
    const filePath = absolutePathFor(storageKey)

    try {
      const [content, details] = await Promise.all([readFile(filePath), stat(filePath)])
      return {
        content,
        sizeBytes: details.size,
      }
    } catch {
      throw new AppError({
        code: "ASSET_NOT_FOUND",
        message: "Requested asset was not found.",
        statusCode: 404,
      })
    }
  },
}
