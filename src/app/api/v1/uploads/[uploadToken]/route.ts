import { defineRoute } from "@/core/http/route-handler"
import { AppError } from "@/core/errors/app-error"
import { ok } from "@/lib/api-response"
import { assetStorageService } from "@/modules/assets"
import { uploadService } from "@/modules/uploads"

export const PUT = defineRoute(async (request, context) => {
  const uploadToken = request.nextUrl.pathname.split("/").at(-1) ?? ""
  const verified = uploadService.verifyUploadToken(uploadToken)
  const content = Buffer.from(await request.arrayBuffer())

  if (content.byteLength !== verified.sizeBytes) {
    throw new AppError({
      code: "UPLOAD_SIZE_MISMATCH",
      message: "Uploaded file size does not match the upload contract.",
      statusCode: 400,
    })
  }

  await assetStorageService.write(verified.storageKey, content)

  return ok(
    {
      accepted: true,
      storageKey: verified.storageKey,
      expiresAt: verified.expiresAt,
    },
    { correlationId: context.correlationId },
  )
})
