import { ok } from "@/lib/api-response"
import { ensureProjectAccess } from "@/interfaces/http/support/authorization"
import { resolveRequestActor } from "@/interfaces/http/support/request-actor"
import { serializePlaybackPlan } from "@/modules/assets"
import { projectService } from "@/modules/projects"
import { playbackService } from "@/modules/playback"
import type { RequestContext } from "@/core/request/context"

export const previewController = {
  async status(projectId: string, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "preview", project)
    const status = await playbackService.previewStatus(projectId)
    return ok(status, { correlationId: context.correlationId })
  },

  async playback(projectId: string, reducedMotion: boolean, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "preview", project)
    const playback = await playbackService.latest(projectId, { reducedMotion })
    return ok(serializePlaybackPlan(playback), { correlationId: context.correlationId })
  },
}
