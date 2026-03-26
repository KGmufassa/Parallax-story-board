import { DEFAULT_SCENE_LAYER_COUNT } from "@/config/constants"
import { qwenClient } from "@/infrastructure/providers/qwen/client"
import type { DecompositionArtifact, DecompositionRequest, DecompositionResult } from "@/modules/decomposition/types"
import { ProviderError } from "@/modules/decomposition/types"

function normalizeArtifact(raw: Record<string, unknown> | null | undefined): DecompositionArtifact | null {
  if (!raw) {
    return null
  }

  const assetUrl = typeof raw.assetUrl === "string" ? raw.assetUrl : typeof raw.imageUrl === "string" ? raw.imageUrl : typeof raw.url === "string" ? raw.url : undefined
  const storageKey =
    typeof raw.storageKey === "string" ? raw.storageKey : typeof raw.storagePath === "string" ? raw.storagePath : undefined
  const base64Data =
    typeof raw.base64Data === "string"
      ? raw.base64Data
      : typeof raw.base64 === "string"
        ? raw.base64
        : typeof raw.b64_json === "string"
          ? raw.b64_json
          : undefined
  const mimeType =
    typeof raw.mimeType === "string" ? raw.mimeType : typeof raw.contentType === "string" ? raw.contentType : undefined
  const providerFileId =
    typeof raw.providerFileId === "string" ? raw.providerFileId : typeof raw.fileId === "string" ? raw.fileId : undefined

  if (!assetUrl && !storageKey && !base64Data && !providerFileId) {
    return null
  }

  return {
    assetUrl,
    storageKey,
    base64Data,
    mimeType,
    providerFileId,
    metadata: {
      ...(typeof raw.metadata === "object" && raw.metadata ? (raw.metadata as Record<string, unknown>) : {}),
      ...(providerFileId ? { providerFileId } : {}),
    },
  }
}

export const decompositionAdapter = {
  async decompose(request: DecompositionRequest): Promise<DecompositionResult> {
    const raw = await qwenClient.submit({
      imageUrl: request.imageUrl,
      mimeType: request.mimeType,
      targetLayers: request.targetLayers,
      correlationId: request.correlationId,
    })

    if (!raw || !Array.isArray(raw.layers)) {
      throw new ProviderError("terminal", "QWEN_INVALID_RESPONSE", "Qwen returned an invalid decomposition payload.")
    }

    return {
      providerJobId: String(raw.id ?? `qwen-${request.sceneId}`),
      modelVersion: String(raw.modelVersion ?? "qwen-image-layered"),
      width: typeof raw.width === "number" ? raw.width : request.width,
      height: typeof raw.height === "number" ? raw.height : request.height,
      compositeArtifact: normalizeArtifact(typeof raw.composite === "object" && raw.composite ? (raw.composite as Record<string, unknown>) : null),
      thumbnailArtifact: normalizeArtifact(typeof raw.thumbnail === "object" && raw.thumbnail ? (raw.thumbnail as Record<string, unknown>) : null),
      layers: raw.layers.slice(0, request.targetLayers || DEFAULT_SCENE_LAYER_COUNT).map((layer: any, index: number) => ({
        index,
        width: typeof layer.width === "number" ? layer.width : request.width,
        height: typeof layer.height === "number" ? layer.height : request.height,
        artifact: normalizeArtifact(typeof layer === "object" && layer ? layer : null),
        metadata: {
          source: "qwen",
          depth: layer.depth ?? index,
        },
      })),
      warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
    }
  },
}
