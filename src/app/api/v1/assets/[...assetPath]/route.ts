import { NextResponse } from "next/server"

import { defineRoute } from "@/core/http/route-handler"
import { assetStorageService } from "@/modules/assets"

function contentTypeForAssetPath(assetPath: string) {
  if (assetPath.endsWith(".png")) {
    return "image/png"
  }

  if (assetPath.endsWith(".webp")) {
    return "image/webp"
  }

  if (assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg")) {
    return "image/jpeg"
  }

  if (assetPath.endsWith(".json")) {
    return "application/json"
  }

  return "application/octet-stream"
}

export const GET = defineRoute(async (request) => {
  const encodedAssetPath = request.nextUrl.pathname.split("/api/v1/assets/").at(1) ?? ""
  const assetPath = decodeURIComponent(encodedAssetPath)
  const asset = await assetStorageService.read(assetPath)

  return new NextResponse(asset.content, {
    status: 200,
    headers: {
      "Content-Length": String(asset.sizeBytes),
      "Content-Type": contentTypeForAssetPath(assetPath),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
})
