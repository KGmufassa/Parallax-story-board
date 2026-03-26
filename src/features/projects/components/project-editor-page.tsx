"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import type { Route } from "next"
import Link from "next/link"

import { PlaybackSceneRenderer } from "@/features/preview/components/playback-scene-renderer"
import {
  buildNormalizedPlaybackState,
  parseApiResponse,
  resolveProjectSceneImage,
  type ApiErrorEnvelope,
  type ApiEnvelope,
  type NormalizedPlaybackState,
  type PlaybackResponse,
  type ProjectRecord,
} from "@/features/preview/lib/playback-client"
import { AppHeader } from "@/features/shared/components/app-header"
import { AppIcon } from "@/features/shared/components/app-icon"
import type { GroupKey, MobileGroupScrollMapping, SceneGroupingConfig } from "@/modules/scenes/types"

type ProjectEditorPageProps = {
  projectId: string
}

type SessionActor =
  | { kind: "anonymous" }
  | { kind: "guest"; guestSessionId: string; expiresAt: string }
  | { kind: "authenticated"; userId: string; email?: string | null; guestSessionId?: string | null }

type SceneRecord = ProjectRecord["scenes"][number]

type UploadContract = {
  uploadToken: string
  uploadUrl: string
  mimeType: string
}

const GROUP_KEYS: GroupKey[] = ["background", "midground", "foreground"]

const GROUP_LABELS: Record<GroupKey, string> = {
  background: "Background",
  midground: "Midground",
  foreground: "Foreground",
}

const DEFAULT_GROUP_MAPPINGS: Record<GroupKey, MobileGroupScrollMapping> = {
  background: {
    startProgress: 0,
    endProgress: 1,
    translateX: -6,
    translateY: -18,
    scaleFrom: 1,
    scaleTo: 1.06,
    opacityFrom: 1,
    opacityTo: 0.94,
    speedMultiplier: 0.72,
    easing: "ease-out",
  },
  midground: {
    startProgress: 0,
    endProgress: 1,
    translateX: 0,
    translateY: -30,
    scaleFrom: 1,
    scaleTo: 1.1,
    opacityFrom: 1,
    opacityTo: 0.98,
    speedMultiplier: 1,
    easing: "linear",
  },
  foreground: {
    startProgress: 0,
    endProgress: 1,
    translateX: 10,
    translateY: -46,
    scaleFrom: 1,
    scaleTo: 1.16,
    opacityFrom: 1,
    opacityTo: 1,
    speedMultiplier: 1.22,
    easing: "ease-in-out",
  },
}

const GROUP_MAPPING_FIELDS: Array<{
  field: keyof MobileGroupScrollMapping
  label: string
  type: "number" | "select"
  step?: number
  min?: number
  max?: number
}> = [
  { field: "startProgress", label: "Start Progress", type: "number", step: 0.01, min: 0, max: 1 },
  { field: "endProgress", label: "End Progress", type: "number", step: 0.01, min: 0, max: 1 },
  { field: "translateX", label: "Translate X", type: "number", step: 1, min: -1000, max: 1000 },
  { field: "translateY", label: "Translate Y", type: "number", step: 1, min: -1000, max: 1000 },
  { field: "scaleFrom", label: "Scale From", type: "number", step: 0.01, min: 0.1, max: 3 },
  { field: "scaleTo", label: "Scale To", type: "number", step: 0.01, min: 0.1, max: 3 },
  { field: "opacityFrom", label: "Opacity From", type: "number", step: 0.01, min: 0, max: 1 },
  { field: "opacityTo", label: "Opacity To", type: "number", step: 0.01, min: 0, max: 1 },
  { field: "speedMultiplier", label: "Speed Multiplier", type: "number", step: 0.01, min: 0, max: 5 },
  { field: "easing", label: "Easing", type: "select" },
]

function cloneGroupingConfig(grouping: SceneGroupingConfig | null): SceneGroupingConfig | null {
  return grouping ? JSON.parse(JSON.stringify(grouping)) as SceneGroupingConfig : null
}

function sortLayerIndexes(indexes: number[]) {
  return [...indexes].sort((left, right) => left - right)
}

function buildAutoGroupingFromScene(scene: SceneRecord | null): SceneGroupingConfig | null {
  const layerIndexes = (scene?.assets ?? [])
    .filter((asset) => asset.assetType === "layer")
    .map((asset, index) => (typeof asset.layerOrder === "number" ? asset.layerOrder : index))
    .sort((left, right) => left - right)

  if (layerIndexes.length === 0) {
    return null
  }

  const buckets: Record<GroupKey, number[]> = {
    background: [],
    midground: [],
    foreground: [],
  }

  layerIndexes.forEach((layerIndex, position) => {
    const ratio = layerIndexes.length <= 1 ? 0.5 : position / (layerIndexes.length - 1)
    const groupKey = ratio <= 0.33 ? "background" : ratio >= 0.66 ? "foreground" : "midground"
    buckets[groupKey].push(layerIndex)
  })

  return {
    version: 1,
    groups: GROUP_KEYS.map((groupKey) => ({
      groupKey,
      layerIndexes: buckets[groupKey],
      mobile: { ...DEFAULT_GROUP_MAPPINGS[groupKey] },
    })),
  }
}

function ensureSceneGrouping(scene: SceneRecord | null, grouping: SceneGroupingConfig | null | undefined) {
  const layerIndexes = (scene?.assets ?? [])
    .filter((asset) => asset.assetType === "layer")
    .map((asset, index) => (typeof asset.layerOrder === "number" ? asset.layerOrder : index))

  if (layerIndexes.length === 0) {
    return null
  }

  const assignedLayerIndexes = new Set(grouping?.groups.flatMap((group) => group.layerIndexes) ?? [])
  const unassignedLayerIndexes = layerIndexes.filter((layerIndex) => !assignedLayerIndexes.has(layerIndex))

  return {
    version: 1,
    groups: GROUP_KEYS.map((groupKey) => {
      const existingGroup = grouping?.groups.find((group) => group.groupKey === groupKey)

      return {
        groupKey,
        layerIndexes: sortLayerIndexes([
          ...(existingGroup?.layerIndexes ?? []),
          ...(groupKey === "midground" ? unassignedLayerIndexes : []),
        ]),
        mobile: { ...(existingGroup?.mobile ?? DEFAULT_GROUP_MAPPINGS[groupKey]) },
      }
    }),
  } satisfies SceneGroupingConfig
}

async function readImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file)

  try {
    return await new Promise<{ width?: number; height?: number }>((resolve) => {
      const image = new Image()

      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight })
      }

      image.onerror = () => {
        resolve({})
      }

      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function parseJsonResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  const payload = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorEnvelope | null)
    : null

  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.message ?? "Request failed." : "Request failed.")
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response from the server.")
  }

  return payload.data
}

async function ensureGuestSession() {
  await parseJsonResponse<{ id: string }>(
    await fetch("/api/v1/guest-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }),
  )
}

export function ProjectEditorPage({ projectId }: ProjectEditorPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const scrubRailRef = useRef<HTMLDivElement | null>(null)
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [playback, setPlayback] = useState<NormalizedPlaybackState | null>(null)
  const [actor, setActor] = useState<SessionActor>({ kind: "anonymous" })
  const [activeSceneIndex, setActiveSceneIndex] = useState(0)
  const [projectTitle, setProjectTitle] = useState("")
  const [projectContext, setProjectContext] = useState("")
  const [projectStylePreset, setProjectStylePreset] = useState("")
  const [sceneContext, setSceneContext] = useState("")
  const [sceneMotionPreset, setSceneMotionPreset] = useState("Standard Pan")
  const [sceneMotionIntensity, setSceneMotionIntensity] = useState("medium")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeSceneProgress, setActiveSceneProgress] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("midground")
  const [editableSceneGrouping, setEditableSceneGrouping] = useState<SceneGroupingConfig | null>(null)
  const [savedGroupingSnapshot, setSavedGroupingSnapshot] = useState<SceneGroupingConfig | null>(null)
  const [groupMappingDraft, setGroupMappingDraft] = useState<MobileGroupScrollMapping>(DEFAULT_GROUP_MAPPINGS.midground)

  const loadProject = useCallback(async () => {
    setIsLoading(true)

      try {
      const [projectResult, sessionResult, playbackResult] = await Promise.allSettled([
        fetch(`/api/v1/projects/${projectId}`, { cache: "no-store" }).then((response) => parseApiResponse<ProjectRecord>(response)),
        fetch("/api/v1/auth/session", { cache: "no-store" }).then((response) => parseApiResponse<{ actor: SessionActor }>(response)),
        fetch(`/api/v1/projects/${projectId}/preview/playback`, { cache: "no-store" }).then((response) =>
          parseApiResponse<PlaybackResponse>(response),
        ),
      ])

      if (projectResult.status !== "fulfilled" || sessionResult.status !== "fulfilled") {
        throw new Error("Unable to load this project.")
      }

      const projectData = projectResult.value
      const sessionData = sessionResult.value

      setProject(projectData)
      setPlayback(buildNormalizedPlaybackState(projectData, playbackResult.status === "fulfilled" ? playbackResult.value : null))
      setActor(sessionData.actor)
      setProjectTitle(projectData.title)
      setProjectContext(projectData.globalContext ?? "")
      setProjectStylePreset(projectData.stylePreset ?? "")

      const nextScene = projectData.scenes[activeSceneIndex] ?? projectData.scenes[0]
      setActiveSceneIndex(nextScene ? projectData.scenes.findIndex((scene) => scene.id === nextScene.id) : 0)
      setSceneContext(nextScene?.contextText ?? "")
      setSceneMotionPreset(nextScene?.motionPreset ?? "Standard Pan")
      setSceneMotionIntensity(nextScene?.motionIntensity ?? "medium")
      setErrorMessage(null)
    } catch (error) {
      setPlayback(null)
      setErrorMessage(error instanceof Error ? error.message : "Unable to load this project.")
    } finally {
      setIsLoading(false)
    }
  }, [activeSceneIndex, projectId])

  useEffect(() => {
    void loadProject()
  }, [loadProject])

  const scenes = project?.scenes ?? []
  const activeScene = scenes[activeSceneIndex] ?? scenes[0] ?? null

  const activeSceneId = activeScene?.id
  const activePlaybackScene = playback?.scenes.find((scene) => scene.id === activeSceneId) ?? playback?.scenes[activeSceneIndex] ?? null
  const activeSceneLayerAssets = useMemo(
    () =>
      (activeScene?.assets ?? [])
        .filter((asset) => asset.assetType === "layer")
        .map((asset, index) => ({
          ...asset,
          resolvedLayerIndex: typeof asset.layerOrder === "number" ? asset.layerOrder : index,
        }))
        .sort((left, right) => left.resolvedLayerIndex - right.resolvedLayerIndex),
    [activeScene],
  )
  const activeGroupConfig = editableSceneGrouping?.groups.find((group) => group.groupKey === selectedGroup) ?? null

  const updateSceneProgress = useCallback((value: number) => {
    setActiveSceneProgress(Math.min(1, Math.max(0, value)))
  }, [])

  const updateSceneProgressFromClientY = useCallback(
    (clientY: number) => {
      const element = scrubRailRef.current

      if (!element) {
        return
      }

      const bounds = element.getBoundingClientRect()
      const ratio = (clientY - bounds.top) / bounds.height
      updateSceneProgress(ratio)
    },
    [updateSceneProgress],
  )

  useEffect(() => {
    if (!activeScene) {
      setSceneContext("")
      setSceneMotionPreset("Standard Pan")
      setSceneMotionIntensity("medium")
      setEditableSceneGrouping(null)
      setSavedGroupingSnapshot(null)
      setGroupMappingDraft(DEFAULT_GROUP_MAPPINGS.midground)
      return
    }

    setSceneContext(activeScene.contextText ?? "")
    setSceneMotionPreset(activeScene.motionPreset ?? "Standard Pan")
    setSceneMotionIntensity(activeScene.motionIntensity ?? "medium")
    const nextGrouping = ensureSceneGrouping(activeScene, activeScene.framingData ?? activePlaybackScene?.groupingConfig ?? buildAutoGroupingFromScene(activeScene))
    setEditableSceneGrouping(cloneGroupingConfig(nextGrouping))
    setSavedGroupingSnapshot(cloneGroupingConfig(nextGrouping))
  }, [activePlaybackScene?.groupingConfig, activeScene, activeSceneId])

  useEffect(() => {
    const nextDraft = editableSceneGrouping?.groups.find((group) => group.groupKey === selectedGroup)?.mobile

    if (nextDraft) {
      setGroupMappingDraft({ ...nextDraft })
    }
  }, [editableSceneGrouping, selectedGroup])

  useEffect(() => {
    setActiveSceneProgress(0)
  }, [activeSceneId])

  const handleScrubPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      updateSceneProgressFromClientY(event.clientY)

      const handlePointerMove = (nextEvent: PointerEvent) => {
        updateSceneProgressFromClientY(nextEvent.clientY)
      }

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
    },
    [updateSceneProgressFromClientY],
  )

  const handleStageWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (!activePlaybackScene) {
        return
      }

      event.preventDefault()
      updateSceneProgress(activeSceneProgress + event.deltaY / 800)
    },
    [activePlaybackScene, activeSceneProgress, updateSceneProgress],
  )

  const handleScrubKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (!activePlaybackScene) {
        return
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault()
        updateSceneProgress(activeSceneProgress - 0.05)
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault()
        updateSceneProgress(activeSceneProgress + 0.05)
      }

      if (event.key === "Home") {
        event.preventDefault()
        updateSceneProgress(0)
      }

      if (event.key === "End") {
        event.preventDefault()
        updateSceneProgress(1)
      }
    },
    [activePlaybackScene, activeSceneProgress, updateSceneProgress],
  )

  const activeSceneDurationMs = activePlaybackScene?.durationMs ?? 2200
  const activeSceneScrubTimeMs = Math.round(activeSceneDurationMs * activeSceneProgress)
  const activeSceneProgressPercent = Math.round(activeSceneProgress * 100)

  const canClaimProject =
    actor.kind === "authenticated" &&
    Boolean(actor.guestSessionId && project?.guestSessionId && !project.ownerId && !project.claimedAt)

  const generateLabel = useMemo(() => {
    if (!project) {
      return "Generate"
    }

    return project.scenes.some((scene) => scene.status !== "ready") ? "Generate" : "Regenerate All"
  }, [project])

  const buildSceneUpdatePayload = useCallback(() => ({
    contextText: sceneContext.trim() ? sceneContext : null,
    motionPreset: sceneMotionPreset,
    motionIntensity: sceneMotionIntensity,
    grouping: editableSceneGrouping,
  }), [editableSceneGrouping, sceneContext, sceneMotionIntensity, sceneMotionPreset])

  const handleSelectGroup = useCallback((groupKey: GroupKey) => {
    setSelectedGroup(groupKey)
  }, [])

  const handleAssignLayerToGroup = useCallback((layerIndex: number, groupKey: GroupKey) => {
    setEditableSceneGrouping((currentGrouping) => {
      const nextGrouping = ensureSceneGrouping(activeScene, currentGrouping ?? buildAutoGroupingFromScene(activeScene))

      if (!nextGrouping) {
        return nextGrouping
      }

      return {
        version: 1,
        groups: nextGrouping.groups.map((group) => ({
          ...group,
          layerIndexes: group.groupKey === groupKey
            ? sortLayerIndexes([...group.layerIndexes.filter((item) => item !== layerIndex), layerIndex])
            : group.layerIndexes.filter((item) => item !== layerIndex),
        })),
      }
    })
    setSelectedGroup(groupKey)
  }, [activeScene])

  const handleAutoAssignLayers = useCallback(() => {
    const nextGrouping = buildAutoGroupingFromScene(activeScene)

    if (!nextGrouping) {
      return
    }

    setEditableSceneGrouping(nextGrouping)
    setSelectedGroup("midground")
  }, [activeScene])

  const handleGroupMappingChange = useCallback(
    (groupKey: GroupKey, field: keyof MobileGroupScrollMapping, value: number | MobileGroupScrollMapping["easing"]) => {
      setEditableSceneGrouping((currentGrouping) => {
        const nextGrouping = ensureSceneGrouping(activeScene, currentGrouping ?? buildAutoGroupingFromScene(activeScene))

        if (!nextGrouping) {
          return nextGrouping
        }

        return {
          version: 1,
          groups: nextGrouping.groups.map((group) =>
            group.groupKey === groupKey
              ? {
                  ...group,
                  mobile: {
                    ...group.mobile,
                    [field]: value,
                  },
                }
              : group,
          ),
        }
      })

      setGroupMappingDraft((currentDraft) => ({
        ...currentDraft,
        [field]: value,
      }))
    },
    [activeScene],
  )

  const handlePreviewReset = useCallback(() => {
    setActiveSceneProgress(0)
  }, [])

  const handleResetSceneMotion = useCallback(() => {
    const nextGrouping = cloneGroupingConfig(savedGroupingSnapshot)
    setEditableSceneGrouping(nextGrouping)
    setGroupMappingDraft({ ...(nextGrouping?.groups.find((group) => group.groupKey === selectedGroup)?.mobile ?? DEFAULT_GROUP_MAPPINGS[selectedGroup]) })
    handlePreviewReset()
    setFeedback("Scene motion reset.")
    setErrorMessage(null)
  }, [handlePreviewReset, savedGroupingSnapshot, selectedGroup])

  const handleSaveSceneMotion = useCallback(async () => {
    if (!activeScene) {
      return
    }

    setIsSaving(true)
    setFeedback("Saving scene motion...")
    setErrorMessage(null)

    try {
      await parseJsonResponse<SceneRecord>(
        await fetch(`/api/v1/scenes/${activeScene.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildSceneUpdatePayload()),
        }),
      )

      await loadProject()
      setSavedGroupingSnapshot(cloneGroupingConfig(editableSceneGrouping))
      setFeedback("Scene motion saved.")
      handlePreviewReset()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save scene motion.")
      setFeedback(null)
    } finally {
      setIsSaving(false)
    }
  }, [activeScene, buildSceneUpdatePayload, editableSceneGrouping, handlePreviewReset, loadProject])

  async function saveProjectAndScene() {
    if (!project) {
      return
    }

    setIsSaving(true)
    setFeedback("Saving changes...")
    setErrorMessage(null)

    try {
      await parseJsonResponse<ProjectRecord>(
        await fetch(`/api/v1/projects/${project.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: projectTitle,
            globalContext: projectContext.trim() ? projectContext : null,
            stylePreset: projectStylePreset.trim() ? projectStylePreset : null,
          }),
        }),
      )

      if (activeScene) {
        await parseJsonResponse<SceneRecord>(
          await fetch(`/api/v1/scenes/${activeScene.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(buildSceneUpdatePayload()),
          }),
        )
      }

      await loadProject()
      setFeedback("Project saved.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save this project.")
      setFeedback(null)
    } finally {
      setIsSaving(false)
    }
  }

  async function reorderScene(direction: -1 | 1) {
    if (!project || !activeScene) {
      return
    }

    const currentIndex = project.scenes.findIndex((scene) => scene.id === activeScene.id)
    const nextIndex = currentIndex + direction

    if (nextIndex < 0 || nextIndex >= project.scenes.length) {
      return
    }

    const nextSceneIds = [...project.scenes.map((scene) => scene.id)]
    const [movedSceneId] = nextSceneIds.splice(currentIndex, 1)
    nextSceneIds.splice(nextIndex, 0, movedSceneId)

    setFeedback("Updating scene order...")
    setErrorMessage(null)

    try {
      const updatedProject = await parseJsonResponse<ProjectRecord>(
        await fetch(`/api/v1/projects/${project.id}/scenes/reorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sceneIds: nextSceneIds }),
        }),
      )

      setProject(updatedProject)
      setActiveSceneIndex(nextIndex)
      setFeedback("Scene order updated.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reorder scenes.")
      setFeedback(null)
    }
  }

  async function processScene(sceneId: string, mode: "retry" | "regenerate") {
    setFeedback(mode === "retry" ? "Retrying scene..." : "Regenerating scene...")
    setErrorMessage(null)

    try {
      await parseJsonResponse<unknown>(
        await fetch(`/api/v1/scenes/${sceneId}/${mode}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: `editor-${mode}` }),
        }),
      )

      await loadProject()
      setFeedback(mode === "retry" ? "Scene queued again." : "Scene regeneration queued.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reprocess this scene.")
      setFeedback(null)
    }
  }

  async function deleteScene(sceneId: string) {
    setFeedback("Removing scene...")
    setErrorMessage(null)

    try {
      await parseJsonResponse<{ deleted: boolean }>(
        await fetch(`/api/v1/scenes/${sceneId}`, {
          method: "DELETE",
        }),
      )

      await loadProject()
      setActiveSceneIndex((currentIndex) => Math.max(0, currentIndex - 1))
      setFeedback("Scene removed.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete this scene.")
      setFeedback(null)
    }
  }

  async function handleGenerateAll() {
    if (!project) {
      return
    }

    const pendingScenes = project.scenes.filter((scene) => scene.status !== "ready")
    const targetScenes = pendingScenes.length > 0 ? pendingScenes : project.scenes

    setFeedback(`Queueing ${targetScenes.length} scene${targetScenes.length === 1 ? "" : "s"}...`)
    setErrorMessage(null)

    try {
      for (const scene of targetScenes) {
        await parseJsonResponse<unknown>(
          await fetch(`/api/v1/scenes/${scene.id}/${scene.status === "ready" ? "regenerate" : "retry"}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason: "editor-generate-all" }),
          }),
        )
      }

      await loadProject()
      setFeedback("Scene processing queued.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to queue generation.")
      setFeedback(null)
    }
  }

  async function claimProject() {
    if (!project || actor.kind !== "authenticated") {
      return
    }

    setFeedback("Claiming guest project...")
    setErrorMessage(null)

    try {
      const claimedProject = await parseJsonResponse<ProjectRecord>(
        await fetch(`/api/v1/projects/${project.id}/claim`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guestSessionId: actor.guestSessionId,
          }),
        }),
      )

      setProject(claimedProject)
      setFeedback("Project claimed to your account.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to claim this project.")
      setFeedback(null)
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (!project || files.length === 0) {
      return
    }

    setIsUploading(true)
    setFeedback("Preparing uploads...")
    setErrorMessage(null)

    try {
      let initResponse = await fetch(`/api/v1/projects/${project.id}/uploads/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: files.map((file) => ({
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          })),
        }),
      })

      if (initResponse.status === 401) {
        await ensureGuestSession()
        initResponse = await fetch(`/api/v1/projects/${project.id}/uploads/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: files.map((file) => ({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
            })),
          }),
        })
      }

      const uploadContracts = await parseJsonResponse<{ uploads: UploadContract[] }>(initResponse)
      setFeedback("Uploading scene originals...")

      await Promise.all(
        uploadContracts.uploads.map((contract, index) =>
          fetch(contract.uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": files[index]?.type || contract.mimeType,
              },
              body: files[index],
            }).then((response) => parseJsonResponse<unknown>(response)),
        ),
      )

      const dimensions = await Promise.all(files.map((file) => readImageDimensions(file)))
      setFeedback("Finalizing scene uploads...")

      await parseJsonResponse<SceneRecord[]>(
        await fetch(`/api/v1/projects/${project.id}/uploads/finalize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uploads: files.map((file, index) => ({
              uploadToken: uploadContracts.uploads[index]?.uploadToken,
              originalFilename: file.name,
              mimeType: file.type || uploadContracts.uploads[index]?.mimeType || "application/octet-stream",
              sizeBytes: file.size,
              width: dimensions[index]?.width,
              height: dimensions[index]?.height,
            })),
          }),
        }),
      )

      await loadProject()
      setFeedback(`${files.length} new scene${files.length === 1 ? "" : "s"} added to the timeline.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload these files.")
      setFeedback(null)
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <main className="editor-screen">
      <AppHeader active="projects" />

      <section className="editor-action-bar">
        <div className="editor-action-bar__title-wrap">
          <Link className="editor-icon-button" href={"/projects" as Route}>
            <AppIcon className="editor-icon" name="arrow_back" />
          </Link>
          <div className="editor-action-bar__title-block">
            <div className="editor-title-row">
              <input onChange={(event) => setProjectTitle(event.target.value)} type="text" value={projectTitle} />
              <span>{project?.status ?? "loading"}</span>
            </div>
            <p>Project ID: {projectId}</p>
          </div>
        </div>

        <div className="editor-action-bar__actions">
          <button className="editor-top-button" disabled={isLoading || isSaving} onClick={() => void saveProjectAndScene()} type="button">
            <AppIcon className="editor-inline-icon" name="save" />
            {isSaving ? "Saving..." : "Save"}
          </button>
          <Link className="editor-top-button" href={`/projects/${projectId}/preview` as Route}>
            <AppIcon className="editor-inline-icon" name="visibility" />
            Preview
          </Link>
          <button className="editor-top-button" disabled type="button" title={actor.kind === "authenticated" ? "Export is intentionally unavailable in the MVP while preview remains the validation path." : "Sign in to claim this project first. Export is intentionally unavailable in the MVP while preview remains the validation path."}>
            <AppIcon className="editor-inline-icon" name="ios_share" />
            Export Unavailable
          </button>
          <button className="editor-top-button editor-top-button--primary" disabled={isLoading || scenes.length === 0} onClick={() => void handleGenerateAll()} type="button">
            <AppIcon className="editor-inline-icon" name="bolt" />
            {generateLabel}
          </button>
        </div>
      </section>

      {feedback ? <p className="new-project-feedback">{feedback}</p> : null}
      {errorMessage ? <p className="new-project-error">{errorMessage}</p> : null}
      {actor.kind === "guest" ? <p className="new-project-feedback">Guest projects stay editable for this session. Sign in anytime to claim permanent ownership.</p> : null}
      {canClaimProject ? (
        <div className="editor-action-bar__actions" style={{ justifyContent: "center", padding: "0 1.5rem 1rem" }}>
          <button className="editor-top-button editor-top-button--primary" onClick={() => void claimProject()} type="button">
            Claim This Guest Project
          </button>
        </div>
      ) : null}

      <section className="editor-layout">
        <aside className="editor-scenes-panel">
          <div className="editor-upload-box">
            <button className="editor-upload-button" disabled={isUploading || !project} onClick={() => fileInputRef.current?.click()} type="button">
              <AppIcon className="editor-upload-icon" name="upload_file" />
              <span>{isUploading ? "Uploading..." : "Upload Images"}</span>
            </button>
            <input accept="image/*" hidden multiple onChange={handleFileSelection} ref={fileInputRef} type="file" />
          </div>
          <div className="editor-scenes-list">
            <h3>Timeline Scenes</h3>
            {isLoading ? <p>Loading scenes...</p> : null}
            {!isLoading && scenes.length === 0 ? <p>No scenes yet. Upload images to start your story.</p> : null}
            {scenes.map((scene, index) => (
              <article className={index === activeSceneIndex ? "editor-scene-card is-active" : "editor-scene-card"} key={scene.id}>
                {index === activeSceneIndex ? <AppIcon className="editor-scene-card__drag" name="drag_indicator" /> : null}
                <button className="editor-scene-card__button" onClick={() => setActiveSceneIndex(index)} type="button">
                  <div className="editor-scene-card__image-wrap">
                    <div className="editor-scene-card__image" style={resolveProjectSceneImage(scene) ? { backgroundImage: `url("${resolveProjectSceneImage(scene)}")` } : undefined} />
                  </div>
                  <div className="editor-scene-card__meta">
                    <span>Scene {String(index + 1).padStart(2, "0")}</span>
                    <strong>{scene.status}</strong>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </aside>

        <section className="editor-stage-panel">
          <div className="editor-stage-shell">
            <div className="editor-stage-frame" onWheel={handleStageWheel}>
              {activePlaybackScene ? (
                <PlaybackSceneRenderer
                  className="editor-stage-frame__image"
                  isReducedMotion={playback?.isReducedMotion}
                  progress={activeSceneProgress}
                  scene={activePlaybackScene}
                />
              ) : (
                <div className="editor-stage-frame__image" />
              )}
              <div className="editor-stage-frame__progress-readout">
                <span>Scene scroll</span>
                <strong>
                  {activeSceneScrubTimeMs} / {activeSceneDurationMs} ms
                </strong>
              </div>
              <div className="editor-stage-frame__progress-caption">
                <span>{activeSceneProgressPercent}%</span>
                <span>{activePlaybackScene?.cameraMovement ?? "waiting"}</span>
              </div>
              <div className="editor-stage-frame__safe-zone">{activeScene ? `${activeScene.status} scene preview` : "Upload a scene to begin"}</div>
            </div>

            <div
              aria-label="Scene parallax scrub bar"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={activeSceneProgressPercent}
              className="editor-stage-scrubber"
              onKeyDown={handleScrubKeyDown}
              onPointerDown={handleScrubPointerDown}
              ref={scrubRailRef}
              role="slider"
              tabIndex={activePlaybackScene ? 0 : -1}
            >
              <div className="editor-stage-scrubber__track" />
              <div className="editor-stage-scrubber__fill" style={{ height: `${activeSceneProgressPercent}%` }} />
              <div className="editor-stage-scrubber__thumb" style={{ top: `calc(${activeSceneProgressPercent}% - 16px)` }} />
              <div className="editor-stage-scrubber__labels">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="editor-inspector-panel">
          <div className="editor-tab-row" aria-label="Editor focus areas">
            <span className="editor-tab-row__item is-active">Scene editor</span>
            <span className="editor-tab-row__item">Project details</span>
          </div>

          <div className="editor-inspector-panel__body">
            {activeScene ? (
              <div key={activeScene.id}>
                <div className="editor-form-group">
                  <label>Scene Name</label>
                  <div className="editor-select-wrap">
                    <select onChange={(event) => setActiveSceneIndex(Number(event.target.value))} value={activeSceneIndex}>
                      {scenes.map((scene, index) => (
                        <option key={scene.id} value={index}>
                          Scene {String(index + 1).padStart(2, "0")} - {scene.status}
                        </option>
                      ))}
                    </select>
                    <AppIcon className="editor-select-icon" name="expand_more" />
                  </div>
                </div>
                <div className="editor-form-group">
                  <label>Scene Context</label>
                  <textarea onChange={(event) => setSceneContext(event.target.value)} rows={4} value={sceneContext} />
                </div>
                <div className="editor-form-group">
                  <label>Motion Preset</label>
                  <div className="editor-select-wrap">
                    <select onChange={(event) => setSceneMotionPreset(event.target.value)} value={sceneMotionPreset}>
                      <option>Standard Pan</option>
                      <option>Cinematic Push</option>
                      <option>Parallax Tilt</option>
                      <option>Vertical Scroll</option>
                      <option>Hold Still</option>
                    </select>
                    <AppIcon className="editor-select-icon" name="expand_more" />
                  </div>
                </div>
                <div className="editor-form-group">
                  <label>Motion Intensity</label>
                  <div className="editor-select-wrap">
                    <select onChange={(event) => setSceneMotionIntensity(event.target.value)} value={sceneMotionIntensity}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <AppIcon className="editor-select-icon" name="expand_more" />
                  </div>
                </div>
                <div className="editor-grouping-panel">
                  <div className="editor-grouping-panel__header">
                    <div>
                      <h3>Scene Motion Groups</h3>
                      <p>Tablet and Desktop are auto-scaled from Mobile</p>
                    </div>
                    <button className="editor-depth-grid__button" onClick={handlePreviewReset} type="button">
                      Reset Preview
                    </button>
                  </div>

                  <div className="editor-grouping-panel__button-row" aria-label="Device controls">
                    <button className="editor-grouping-toggle is-active" type="button">
                      Mobile
                    </button>
                  </div>

                  <div className="editor-grouping-panel__button-row" aria-label="Group controls">
                    {GROUP_KEYS.map((groupKey) => (
                      <button
                        className={groupKey === selectedGroup ? "editor-grouping-toggle is-active" : "editor-grouping-toggle"}
                        key={groupKey}
                        onClick={() => handleSelectGroup(groupKey)}
                        type="button"
                      >
                        {GROUP_LABELS[groupKey]}
                      </button>
                    ))}
                  </div>

                  <div className="editor-grouping-panel__action-row">
                    <button className="editor-depth-grid__button" onClick={handleAutoAssignLayers} type="button">
                      Auto Assign Layers
                    </button>
                    <button className="editor-depth-grid__button" onClick={() => void handleSaveSceneMotion()} type="button">
                      Save Scene Motion
                    </button>
                    <button className="editor-depth-grid__button" onClick={handleResetSceneMotion} type="button">
                      Reset Scene Motion
                    </button>
                  </div>

                  {activeGroupConfig ? (
                    <div className="editor-grouping-panel__grid">
                      {GROUP_MAPPING_FIELDS.map((fieldConfig) => (
                        <label className="editor-grouping-input" key={fieldConfig.field}>
                          <span>{fieldConfig.label}</span>
                          {fieldConfig.type === "select" ? (
                            <div className="editor-select-wrap">
                              <select
                                onChange={(event) =>
                                  handleGroupMappingChange(selectedGroup, fieldConfig.field, event.target.value as MobileGroupScrollMapping["easing"])
                                }
                                value={groupMappingDraft[fieldConfig.field] as string}
                              >
                                <option value="linear">linear</option>
                                <option value="ease-out">ease-out</option>
                                <option value="ease-in-out">ease-in-out</option>
                              </select>
                              <AppIcon className="editor-select-icon" name="expand_more" />
                            </div>
                          ) : (
                            <input
                              max={fieldConfig.max}
                              min={fieldConfig.min}
                              onChange={(event) => handleGroupMappingChange(selectedGroup, fieldConfig.field, Number(event.target.value))}
                              step={fieldConfig.step}
                              type="number"
                              value={groupMappingDraft[fieldConfig.field] as number}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="editor-grouping-panel__layers">
                    {activeSceneLayerAssets.length > 0 ? (
                      activeSceneLayerAssets.map((asset) => {
                        const assignedGroup = editableSceneGrouping?.groups.find((group) => group.layerIndexes.includes(asset.resolvedLayerIndex))

                        return (
                          <article className="editor-layer-card" key={`${activeScene.id}-${asset.resolvedLayerIndex}`}>
                            <div className="editor-layer-card__meta">
                              <div>
                                <strong>Layer {asset.resolvedLayerIndex + 1}</strong>
                                <span>{assignedGroup ? GROUP_LABELS[assignedGroup.groupKey] : "Unassigned"}</span>
                              </div>
                              <div className="editor-layer-card__preview" style={{ backgroundImage: `url("${asset.assetUrl}")` }} />
                            </div>

                            <div className="editor-layer-card__actions">
                              <button className="editor-depth-grid__button" onClick={() => handleAssignLayerToGroup(asset.resolvedLayerIndex, "background")} type="button">
                                Assign to Background
                              </button>
                              <button className="editor-depth-grid__button" onClick={() => handleAssignLayerToGroup(asset.resolvedLayerIndex, "midground")} type="button">
                                Assign to Midground
                              </button>
                              <button className="editor-depth-grid__button" onClick={() => handleAssignLayerToGroup(asset.resolvedLayerIndex, "foreground")} type="button">
                                Assign to Foreground
                              </button>
                            </div>
                          </article>
                        )
                      })
                    ) : (
                      <p className="editor-grouping-panel__empty">Process this scene to unlock grouped layer assignments.</p>
                    )}
                  </div>
                </div>
                <div className="editor-depth-grid">
                  <button className="editor-depth-grid__button" disabled={activeSceneIndex === 0} onClick={() => void reorderScene(-1)} type="button">
                    Move Up
                  </button>
                  <button className="editor-depth-grid__button" disabled={activeSceneIndex >= scenes.length - 1} onClick={() => void reorderScene(1)} type="button">
                    Move Down
                  </button>
                  <button className="editor-depth-grid__button" onClick={() => void deleteScene(activeScene.id)} type="button">
                    Delete
                  </button>
                </div>
                <div className="preview-scene-copy__badges" style={{ marginTop: "1rem" }}>
                  <span>{activeScene.status}</span>
                  {activeScene.status === "failed" ? <span>Action required</span> : null}
                </div>
              </div>
            ) : null}

            <div className="editor-global-section">
              <h3>Project Settings</h3>
              <div className="editor-form-group">
                <label>Project Context</label>
                <textarea onChange={(event) => setProjectContext(event.target.value)} rows={2} value={projectContext} />
              </div>
              <div className="editor-form-group">
                <label>Style Preset</label>
                <input onChange={(event) => setProjectStylePreset(event.target.value)} type="text" value={projectStylePreset} />
              </div>
              <div className="editor-output-row">
                <div>
                  <span>Output Format</span>
                  <strong>{project?.outputFormat ?? "9:16 Portrait"}</strong>
                </div>
                <AppIcon className="editor-output-icon" name="public" />
              </div>
            </div>

            <div className="editor-global-section editor-playback-panel">
              <h3>Playback Panel</h3>
              <div className="preview-scene-copy__badges" style={{ marginTop: "1rem" }}>
                <span>{playback?.playbackVersion ? `Version ${playback.playbackVersion}` : "Pending stitch"}</span>
                <span>{playback?.isFallback ? "Fallback active" : "Primary playback"}</span>
                <span>{playback?.isReducedMotion ? "Reduced motion" : "Standard motion"}</span>
              </div>

              {activePlaybackScene ? (
                <div className="editor-playback-panel__meta">
                  <p>{activePlaybackScene.detail}</p>
                  <div className="editor-playback-panel__grid">
                    <div>
                      <span>Start</span>
                      <strong>{activePlaybackScene.startsAtMs ?? 0} ms</strong>
                    </div>
                    <div>
                      <span>Duration</span>
                      <strong>{activePlaybackScene.durationMs ?? 2200} ms</strong>
                    </div>
                    <div>
                      <span>Scrub Point</span>
                      <strong>{activeSceneScrubTimeMs} ms</strong>
                    </div>
                    <div>
                      <span>Scroll Progress</span>
                      <strong>{activeSceneProgressPercent}%</strong>
                    </div>
                    <div>
                      <span>Movement</span>
                      <strong>{activePlaybackScene.cameraMovement}</strong>
                    </div>
                    <div>
                      <span>Intensity</span>
                      <strong>{activePlaybackScene.intensity}</strong>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="editor-playback-order">
                {(playback?.scenes ?? []).map((scene) => (
                  <div className={scene.id === activePlaybackScene?.id ? "editor-playback-order__item is-active" : "editor-playback-order__item"} key={scene.id}>
                    <div>
                      <span>{scene.title}</span>
                      <strong>{scene.status}</strong>
                    </div>
                    <div>
                      <span>{scene.startsAtMs ?? 0} ms</span>
                      <strong>{scene.fallback ? "Fallback" : "Primary"}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="editor-inspector-panel__footer">
            <button className="editor-reprocess-button" disabled={!activeScene} onClick={() => activeScene && void processScene(activeScene.id, activeScene.status === "ready" ? "regenerate" : "retry")} type="button">
              <AppIcon className="editor-inline-icon" name="restart_alt" />
              {activeScene?.status === "ready" ? "Reprocess Scene" : "Retry Scene"}
            </button>
          </div>
        </aside>
      </section>
    </main>
  )
}
