import { Prisma } from "@prisma/client"

import { buildCompositeAssetPath, buildLayerAssetPath, buildManifestAssetPath, buildThumbnailAssetPath } from "@/modules/assets/pathing"
import { sceneRepository } from "@/modules/scenes/repository"
import { assetStorageService, toStorageKey } from "@/modules/assets/storage"
import type { DecompositionArtifact } from "@/modules/decomposition/types"

type PersistAssetsInput = {
  projectId: string
  sceneId: string
  generationVersion: number
  sourceAssetPath: string
  expiresAt?: Date | null
  width?: number
  height?: number
  compositeArtifact?: DecompositionArtifact | null
  thumbnailArtifact?: DecompositionArtifact | null
  layers: Array<{
    index: number
    width?: number
    height?: number
    metadata: Record<string, unknown>
    artifact?: DecompositionArtifact | null
  }>
}

function decodeBase64Artifact(value: string) {
  const payload = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value
  return Buffer.from(payload, "base64")
}

async function persistArtifact(targetPath: string, sourceAssetPath: string, artifact?: DecompositionArtifact | null) {
  if (artifact?.base64Data) {
    await assetStorageService.write(targetPath, decodeBase64Artifact(artifact.base64Data))
    return { persistedFrom: "base64", fallbackUsed: false }
  }

  if (artifact?.storageKey) {
    await assetStorageService.copy(artifact.storageKey, targetPath)
    return { persistedFrom: "storage", fallbackUsed: false }
  }

  if (artifact?.assetUrl) {
    if (artifact.assetUrl.startsWith("data:")) {
      await assetStorageService.write(targetPath, decodeBase64Artifact(artifact.assetUrl))
      return { persistedFrom: "data-url", fallbackUsed: false }
    }

    if (artifact.assetUrl.startsWith("http://") || artifact.assetUrl.startsWith("https://")) {
      const response = await fetch(artifact.assetUrl)

      if (!response.ok) {
        throw new Error(`Unable to fetch generated asset from ${artifact.assetUrl}.`)
      }

      const content = Buffer.from(await response.arrayBuffer())
      await assetStorageService.write(targetPath, content)
      return { persistedFrom: "remote-url", fallbackUsed: false }
    }

    await assetStorageService.copy(toStorageKey(artifact.assetUrl), targetPath)
    return { persistedFrom: "asset-url", fallbackUsed: false }
  }

  await assetStorageService.copy(sourceAssetPath, targetPath)
  return { persistedFrom: "source-copy", fallbackUsed: true }
}

export const assetService = {
  async persistDecompositionAssets(input: PersistAssetsInput) {
    const compositePath = buildCompositeAssetPath(input.projectId, input.sceneId, input.generationVersion)
    const thumbnailPath = buildThumbnailAssetPath(input.projectId, input.sceneId, input.generationVersion)
    const manifestPath = buildManifestAssetPath(input.projectId, input.sceneId, input.generationVersion)
    const layerPaths = input.layers.map((layer) => ({
      ...layer,
      path: buildLayerAssetPath(input.projectId, input.sceneId, input.generationVersion, layer.index),
    }))

    const manifest = {
      projectId: input.projectId,
      sceneId: input.sceneId,
      generationVersion: input.generationVersion,
      compositePath,
      thumbnailPath,
      generatedAt: new Date().toISOString(),
    }

    const [compositePersistence, thumbnailPersistence, layerPersistence] = await Promise.all([
      persistArtifact(compositePath, input.sourceAssetPath, input.compositeArtifact),
      persistArtifact(thumbnailPath, input.sourceAssetPath, input.thumbnailArtifact),
      Promise.all(
        layerPaths.map(async (layer) => ({
          index: layer.index,
          result: await persistArtifact(layer.path, input.sourceAssetPath, layer.artifact),
        })),
      ),
    ])

    const manifestWithArtifacts = {
      ...manifest,
      composite: {
        path: compositePath,
        persistedFrom: compositePersistence.persistedFrom,
        fallbackUsed: compositePersistence.fallbackUsed,
      },
      thumbnail: {
        path: thumbnailPath,
        persistedFrom: thumbnailPersistence.persistedFrom,
        fallbackUsed: thumbnailPersistence.fallbackUsed,
      },
      layers: layerPaths.map((layer) => {
        const persistence = layerPersistence.find((entry) => entry.index === layer.index)?.result

        return {
          index: layer.index,
          path: layer.path,
          width: layer.width ?? null,
          height: layer.height ?? null,
          persistedFrom: persistence?.persistedFrom ?? "source-copy",
          fallbackUsed: persistence?.fallbackUsed ?? true,
          metadata: {
            ...layer.metadata,
            artifact: layer.artifact
              ? {
                  assetUrl: layer.artifact.assetUrl ?? null,
                  storageKey: layer.artifact.storageKey ?? null,
                  mimeType: layer.artifact.mimeType ?? null,
                  providerFileId: layer.artifact.providerFileId ?? null,
                  metadata: layer.artifact.metadata ?? null,
                }
              : null,
          },
        }
      }),
    }

    await assetStorageService.write(manifestPath, JSON.stringify(manifestWithArtifacts, null, 2))

    return sceneRepository.replaceGeneratedAssets(input.sceneId, {
      expiresAt: input.expiresAt,
      layerAssets: layerPaths.map((layer) => ({
        assetUrl: layer.path,
        width: layer.width,
        height: layer.height,
        layerOrder: layer.index,
        metadataJson: {
          ...layer.metadata,
          artifact: layer.artifact
            ? {
                assetUrl: layer.artifact.assetUrl ?? null,
                storageKey: layer.artifact.storageKey ?? null,
                mimeType: layer.artifact.mimeType ?? null,
                providerFileId: layer.artifact.providerFileId ?? null,
                metadata: layer.artifact.metadata ?? null,
              }
            : null,
        } as Prisma.InputJsonValue,
      })),
      compositeAsset: {
        assetUrl: compositePath,
        width: input.width,
        height: input.height,
        metadataJson: {
          kind: "composite-preview",
          artifact: input.compositeArtifact
            ? {
                assetUrl: input.compositeArtifact.assetUrl ?? null,
                storageKey: input.compositeArtifact.storageKey ?? null,
                mimeType: input.compositeArtifact.mimeType ?? null,
                providerFileId: input.compositeArtifact.providerFileId ?? null,
                metadata: input.compositeArtifact.metadata ?? null,
              }
            : null,
        } as Prisma.InputJsonValue,
      },
      manifestAsset: {
        assetUrl: manifestPath,
        metadataJson: manifestWithArtifacts as Prisma.InputJsonValue,
      },
    })
  },
}
