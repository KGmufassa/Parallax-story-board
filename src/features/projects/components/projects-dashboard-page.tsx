"use client"

import { useEffect, useMemo, useState } from "react"
import type { Route } from "next"
import Link from "next/link"

import { AppHeader } from "@/features/shared/components/app-header"
import { AppIcon } from "@/features/shared/components/app-icon"

import { ProjectCard } from "./project-card"

type ViewMode = "carousel" | "grid"
type SortMode = "recent" | "name" | "scenes"

type ApiEnvelope<T> = {
  data: T
}

type ApiErrorEnvelope = {
  error?: {
    message?: string
  }
}

type ProjectSummary = {
  id: string
  title: string
  status: string
  updatedAt: string
  scenes: Array<{
    status?: string
    sourceImageUrl: string | null
    thumbnailUrl: string | null
    assets?: Array<{
      assetUrl: string
    }>
  }>
}

type DashboardProject = {
  title: string
  scenes: string
  status: string
  updatedAt: string
  updatedAtIso: string
  projectId: string
  image: string | null
}

function mapProjectToDashboardProject(project: {
  id: string
  title: string
  status: string
  updatedAt: string
  scenes: Array<{
    status?: string
    sourceImageUrl?: string | null
    thumbnailUrl?: string | null
    assets?: Array<{
      assetUrl: string
    }>
    image?: string
  }>
}) {
  return {
    title: project.title,
    scenes: String(Array.isArray(project.scenes) ? project.scenes.length : 0),
    status: project.status,
    updatedAt: formatUpdatedAt(project.updatedAt),
    updatedAtIso: project.updatedAt,
    projectId: project.id,
    image: resolveProjectImage({
      ...project,
      scenes: (Array.isArray(project.scenes) ? project.scenes : []).map((scene) => ({
        sourceImageUrl: scene.sourceImageUrl ?? scene.image ?? null,
        thumbnailUrl: scene.thumbnailUrl ?? scene.image ?? null,
        assets: scene.assets,
      })),
    }),
  }
}

const PROJECTS_PER_PAGE = 4

function isRenderableImageUrl(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/") || value.startsWith("data:")
}

function formatUpdatedAt(value: string) {
  const updatedAt = new Date(value)
  const distanceMs = Date.now() - updatedAt.getTime()

  if (Number.isNaN(updatedAt.getTime()) || distanceMs < 0) {
    return "just now"
  }

  const hours = Math.floor(distanceMs / (60 * 60 * 1000))

  if (hours < 1) {
    return "just now"
  }

  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function resolveProjectImage(project: ProjectSummary) {
  const scenes = Array.isArray(project.scenes) ? project.scenes : []
  const firstScene = scenes[0]

  if (!firstScene) {
    return null
  }

  if (isRenderableImageUrl(firstScene.thumbnailUrl)) {
    return firstScene.thumbnailUrl
  }

  if (isRenderableImageUrl(firstScene.sourceImageUrl)) {
    return firstScene.sourceImageUrl
  }

  const assetUrl = firstScene.assets?.find((asset) => isRenderableImageUrl(asset.assetUrl))?.assetUrl
  return assetUrl ?? null
}

function normalizeProjects(payload: ApiEnvelope<ProjectSummary[]> | null | undefined) {
  return Array.isArray(payload?.data) ? payload.data : []
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
  const response = await fetch("/api/v1/guest-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })

  await parseJsonResponse<{ id: string }>(response)
}

export function ProjectsDashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [carouselPage, setCarouselPage] = useState(0)
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        let response = await fetch("/api/v1/projects", { cache: "no-store" })

        if (response.status === 401) {
          await ensureGuestSession()
          response = await fetch("/api/v1/projects", { cache: "no-store" })
        }

        if (cancelled) {
          return
        }

        const payload = await parseJsonResponse<ProjectSummary[]>(response)
        const projects = normalizeProjects({ data: payload })

        setProjects(
          projects.map((project) => mapProjectToDashboardProject(project)),
        )
      } catch {
        if (!cancelled) {
          setProjects([])
          setErrorMessage("We could not load your projects right now.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredProjects = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const matchingProjects = normalizedQuery
      ? projects.filter((project) =>
          [project.title, project.status, `${project.scenes} scenes`].some((value) => value.toLowerCase().includes(normalizedQuery)),
        )
      : projects

    return [...matchingProjects].sort((left, right) => {
      if (sortMode === "name") {
        return left.title.localeCompare(right.title)
      }

      if (sortMode === "scenes") {
      return Number(right.scenes) - Number(left.scenes)
      }

      return new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime()
    })
  }, [projects, searchQuery, sortMode])

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE))
  const carouselPages = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, pageIndex) => {
        const start = pageIndex * PROJECTS_PER_PAGE
        return filteredProjects.slice(start, start + PROJECTS_PER_PAGE)
      }),
    [filteredProjects, totalPages],
  )

  const setMode = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode !== "carousel") {
      setCarouselPage(0)
    }
  }

  return (
    <main className="projects-screen">
      <AppHeader active="projects" />

      <section className="projects-shell">
        <div className="projects-header-row">
          <div>
            <p className="projects-kicker">Library</p>
            <h1>Your Projects</h1>
            <p>
              Manage and preview your cinematic story sequences. You have {filteredProjects.length} active
              {filteredProjects.length === 1 ? " project" : " projects"} in your library.
            </p>
          </div>
          <Link className="projects-mobile-create" href={"/projects/new" as Route}>
            <AppIcon className="projects-inline-icon" name="add" />
            Create New Sequence
          </Link>
        </div>

        <div className="projects-controls-row">
          <label className="projects-search-field">
            <AppIcon className="projects-search-field__icon" name="search" />
            <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by title or status..." type="search" value={searchQuery} />
          </label>
          <div className="projects-controls-group">
            <div className="projects-view-toggle" aria-label="Project layout view">
              <button
                aria-label="Carousel view"
                aria-pressed={viewMode === "carousel"}
                data-active={viewMode === "carousel"}
                className={viewMode === "carousel" ? "projects-view-toggle__button is-active" : "projects-view-toggle__button"}
                onClick={() => setMode("carousel")}
                title="Carousel view"
                type="button"
              >
                <AppIcon className="projects-view-toggle__icon" name="view_carousel" />
              </button>
              <button
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                data-active={viewMode === "grid"}
                className={viewMode === "grid" ? "projects-view-toggle__button is-active" : "projects-view-toggle__button"}
                onClick={() => setMode("grid")}
                title="Grid view"
                type="button"
              >
                <AppIcon className="projects-view-toggle__icon" name="view_quilt" />
              </button>
            </div>
            <div className="projects-select-wrap">
              <select onChange={(event) => setSortMode(event.target.value as SortMode)} value={sortMode}>
                <option value="recent">Sort by: Recent</option>
                <option value="name">Sort by: Name</option>
                <option value="scenes">Sort by: Scenes</option>
              </select>
              <AppIcon className="projects-select-wrap__icon" name="expand_more" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="projects-empty-state">
            <div className="projects-empty-state__icon">
              <AppIcon className="projects-empty-state__icon-svg" name="hourglass_top" />
            </div>
            <div>
              <h3>Loading your projects</h3>
              <p>Fetching your latest stories and preview routes.</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="projects-empty-state">
            <div className="projects-empty-state__icon">
              <AppIcon className="projects-empty-state__icon-svg" name="info" />
            </div>
            <div>
              <h3>Projects unavailable</h3>
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="projects-empty-state">
            <div className="projects-empty-state__icon">
              <AppIcon className="projects-empty-state__icon-svg" name="create_new_folder" />
            </div>
            <div>
              <h3>{projects.length === 0 ? "Ready to start something new?" : "No projects match your search"}</h3>
              <p>
                {projects.length === 0
                  ? "Create your first project to start uploading scenes and building a stitched mobile preview."
                  : "Try a different title or status query to find the project you want."}
              </p>
            </div>
            <Link className="projects-empty-state__button" href={"/projects/new" as Route}>
              New Project
            </Link>
          </div>
        ) : viewMode === "carousel" ? (
          <section className="projects-carousel" aria-label="Projects carousel">
            <button
              aria-label="Previous projects"
              className="projects-carousel__nav"
              disabled={carouselPage === 0}
              onClick={() => setCarouselPage((page) => Math.max(0, page - 1))}
              type="button"
            >
              <AppIcon className="projects-inline-icon" name="arrow_back" />
            </button>

            <div className="projects-carousel__viewport">
              <div
                className="projects-carousel__track"
                style={{
                  width: `${carouselPages.length * 100}%`,
                  transform: `translateX(-${carouselPage * (100 / carouselPages.length)}%)`,
                }}
              >
                {carouselPages.map((pageProjects, pageIndex) => (
                  <div
                    className="projects-carousel__page"
                    key={`page-${pageIndex}`}
                    style={{ width: `${100 / carouselPages.length}%` }}
                  >
                    <div className="projects-grid projects-grid--carousel">
                      {pageProjects.map((project) => (
                        <ProjectCard key={project.projectId} {...project} viewMode="carousel" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              aria-label="Next projects"
              className="projects-carousel__nav projects-carousel__nav--next"
              disabled={carouselPage >= totalPages - 1}
              onClick={() => setCarouselPage((page) => Math.min(totalPages - 1, page + 1))}
              type="button"
            >
              <AppIcon className="projects-inline-icon" name="arrow_back" />
            </button>
          </section>
        ) : (
          <div className="projects-grid">
             {filteredProjects.map((project) => (
               <ProjectCard key={project.projectId} {...project} viewMode={viewMode} />
             ))}
           </div>
        )}
      </section>

      <footer className="projects-footer">
        <div>
          <AppIcon className="projects-footer__icon" name="auto_awesome_motion" />
          <span>© 2024 Parallax Story Composer. All rights reserved.</span>
        </div>
        <div>
          {[
            "Projects",
            "Preview",
            "Guest claim flow",
            "Local MVP setup",
          ].map((item) => (
            <span className="projects-footer__link" key={item}>{item}</span>
          ))}
        </div>
      </footer>
    </main>
  )
}
