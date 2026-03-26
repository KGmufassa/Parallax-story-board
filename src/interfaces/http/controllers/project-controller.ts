import { created, ok } from "@/lib/api-response"
import { parseJsonBody } from "@/interfaces/http/support/json-body"
import { resolveRequestActor } from "@/interfaces/http/support/request-actor"
import { ensureProjectAccess } from "@/interfaces/http/support/authorization"
import { AppError } from "@/core/errors/app-error"
import { serializeProject, serializeProjects } from "@/modules/assets"
import { projectService } from "@/modules/projects"
import {
  claimProjectInputSchema,
  createProjectInputSchema,
  reorderScenesInputSchema,
  updateProjectInputSchema,
} from "@/modules/projects"
import { sceneService } from "@/modules/scenes"
import { playbackService } from "@/modules/playback"
import type { RequestContext } from "@/core/request/context"

export const projectController = {
  async list(context: RequestContext) {
    const actor = await resolveRequestActor()

    if (actor.kind === "anonymous") {
      throw new AppError({
        code: "AUTH_REQUIRED",
        message: "A guest or authenticated session is required.",
        statusCode: 401,
      })
    }

    const projects = await projectService.list(
      actor.kind === "authenticated"
        ? { kind: "authenticated", userId: actor.userId }
        : { kind: "guest", guestSessionId: actor.guestSessionId },
    )

    return ok(serializeProjects(projects), { correlationId: context.correlationId })
  },

  async create(request: Request, context: RequestContext) {
    const input = await parseJsonBody(request, createProjectInputSchema)
    const actor = await resolveRequestActor()

    if (actor.kind === "anonymous") {
      throw new AppError({
        code: "AUTH_REQUIRED",
        message: "A guest or authenticated session is required to create a project.",
        statusCode: 401,
      })
    }

    const project = await projectService.create({
      title: input.title,
      globalContext: input.globalContext ?? null,
      stylePreset: input.stylePreset ?? null,
      actor:
        actor.kind === "authenticated"
          ? {
              kind: "authenticated",
              userId: actor.userId,
            }
          : {
              kind: "guest",
              guestSessionId: actor.guestSessionId,
              expiresAt: actor.expiresAt ?? new Date(Date.now() + 72 * 60 * 60 * 1000),
            },
    })

    return created(serializeProject(project), { correlationId: context.correlationId })
  },

  async getById(projectId: string, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "preview", project)
    return ok(serializeProject(project), { correlationId: context.correlationId })
  },

  async update(projectId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "edit", project)
    const input = await parseJsonBody(request, updateProjectInputSchema)
    const updatedProject = await projectService.update(projectId, input)
    await playbackService.stitchProject(projectId, {
      allowFallback: true,
      traceId: context.correlationId,
    }).catch(() => null)
    return ok(serializeProject(updatedProject), { correlationId: context.correlationId })
  },

  async remove(projectId: string, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "edit", project)
    await projectService.remove(projectId)
    return ok({ deleted: true }, { correlationId: context.correlationId })
  },

  async claim(projectId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()

    if (actor.kind !== "authenticated") {
      throw new AppError({
        code: "AUTH_REQUIRED",
        message: "Authenticated ownership is required to claim a guest project.",
        statusCode: 401,
      })
    }

    const input = await parseJsonBody(request, claimProjectInputSchema)
    const guestSessionId = input.guestSessionId ?? actor.guestSessionId

    if (!guestSessionId) {
      throw new AppError({
        code: "GUEST_SESSION_REQUIRED",
        message: "A matching guest session is required to claim this project.",
        statusCode: 400,
      })
    }

    const claimedProject = await projectService.claim(projectId, {
      userId: actor.userId,
      guestSessionId,
    })

    return ok(serializeProject(claimedProject), { correlationId: context.correlationId })
  },

  async reorderScenes(projectId: string, request: Request, context: RequestContext) {
    const actor = await resolveRequestActor()
    const project = await projectService.getById(projectId)
    ensureProjectAccess(actor, "edit", project)
    const input = await parseJsonBody(request, reorderScenesInputSchema)

    const currentSceneIds = project.scenes.map((scene) => scene.id).sort()
    const nextSceneIds = [...input.sceneIds].sort()

    if (currentSceneIds.length !== nextSceneIds.length || currentSceneIds.join(",") !== nextSceneIds.join(",")) {
      throw new AppError({
        code: "INVALID_SCENE_REORDER",
        message: "Reorder requests must include every scene in the project exactly once.",
        statusCode: 400,
      })
    }

    await sceneService.reorder(projectId, input.sceneIds)
    await playbackService.stitchProject(projectId, {
      allowFallback: true,
      traceId: context.correlationId,
    })
    const updatedProject = await projectService.getById(projectId)
    return ok(serializeProject(updatedProject), { correlationId: context.correlationId })
  },
}
