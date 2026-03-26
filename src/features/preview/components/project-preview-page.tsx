"use client"

import { useEffect, useMemo, useState } from "react"
import type { Route } from "next"
import Link from "next/link"

import { AppHeader } from "@/features/shared/components/app-header"
import { PlaybackSceneRenderer } from "@/features/preview/components/playback-scene-renderer"
import { buildNormalizedPlaybackState, parseApiResponse, type NormalizedPlaybackState, type PlaybackResponse, type ProjectRecord } from "@/features/preview/lib/playback-client"

type ProjectPreviewPageProps = {
  projectId: string
}

type PreviewState = {
  isLoading: boolean
  errorMessage: string | null
  playback: NormalizedPlaybackState | null
}

const initialState: PreviewState = {
  isLoading: true,
  errorMessage: null,
  playback: null,
}

export function ProjectPreviewPage({ projectId }: ProjectPreviewPageProps) {
  const [state, setState] = useState<PreviewState>(initialState)

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      setState(initialState)

        try {
          const [projectResult, playbackResult] = await Promise.allSettled([
          fetch(`/api/v1/projects/${projectId}`, { cache: "no-store" }).then((response) =>
            parseApiResponse<ProjectRecord>(response, "Unable to load preview data."),
          ),
          fetch(`/api/v1/projects/${projectId}/preview/playback`, { cache: "no-store" }).then((response) =>
            parseApiResponse<PlaybackResponse>(response, "Unable to load preview data."),
          ),
        ])

        if (cancelled) {
          return
        }

        if (projectResult.status !== "fulfilled") {
          setState({
            ...initialState,
            isLoading: false,
            errorMessage: "This project preview could not be loaded.",
          })
          return
        }

        setState({
          isLoading: false,
          errorMessage: null,
          playback: buildNormalizedPlaybackState(projectResult.value, playbackResult.status === "fulfilled" ? playbackResult.value : null),
        })
      } catch {
        if (!cancelled) {
          setState({
            ...initialState,
            isLoading: false,
            errorMessage: "This project preview could not be loaded.",
          })
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [projectId])

  const playback = state.playback

  const previewCountLabel = useMemo(() => {
    if (playback?.scenes.length === 1) {
      return "1 scene"
    }

    return `${playback?.scenes.length ?? 0} scenes`
  }, [playback?.scenes.length])

  return (
    <main className="misc-screen preview-screen">
      <AppHeader active="projects" />

      <section className="misc-shell misc-shell--wide preview-shell">
        <div className="misc-panel preview-page-panel">
          <div className="preview-page-header">
            <div>
              <p className="misc-kicker">Preview</p>
              <h1>{playback?.projectTitle ?? "Project Preview"}</h1>
              <p className="misc-copy">A mobile-first stitched scroll preview for project `{projectId}`.</p>
            </div>
            <div className="preview-page-header__actions">
              <div className="preview-page-badges">
                <span>{previewCountLabel}</span>
                <span>{playback?.projectStatus ?? "draft"}</span>
                {playback?.playbackVersion ? <span>Playback v{playback.playbackVersion}</span> : null}
                {playback?.isFallback ? <span>Fallback playback</span> : null}
                {playback?.isReducedMotion ? <span>Reduced motion</span> : null}
              </div>
              <Link className="misc-button misc-button--secondary" href={`/projects/${projectId}/editor` as Route}>
                Back to Editor
              </Link>
            </div>
          </div>

          {state.isLoading ? (
            <div className="preview-empty-state">
              <div className="preview-empty-state__phone" />
              <div>
                <h2>Loading preview</h2>
                <p>Gathering scene order, images, and playback details for this project.</p>
              </div>
            </div>
          ) : null}

          {!state.isLoading && state.errorMessage ? (
            <div className="preview-empty-state preview-empty-state--error">
              <div>
                <h2>Preview unavailable</h2>
                <p>{state.errorMessage}</p>
              </div>
            </div>
          ) : null}

          {!state.isLoading && !state.errorMessage && (playback?.scenes.length ?? 0) === 0 ? (
            <div className="preview-empty-state">
              <div>
                <h2>No scenes yet</h2>
                <p>Upload images in the editor to build a stitched mobile preview for this project.</p>
              </div>
            </div>
          ) : null}

          {!state.isLoading && !state.errorMessage && (playback?.scenes.length ?? 0) > 0 ? (
            <div className="preview-scroll-stack">
              <section className="preview-scene-section">
                <div className="preview-scene-copy">
                  <p className="preview-scene-copy__eyebrow">Stitched mobile player</p>
                  <h2>Timeline-aware preview</h2>
                  <p>
                    Each scene is stitched into a single vertical player using playback timing. Fallback-ready scenes remain visible so partially processed projects stay previewable.
                  </p>
                  <div className="preview-scene-copy__badges">
                    <span>{playback?.totalDurationMs ?? 0} ms total</span>
                    <span>{playback?.isFallback ? "Partial-ready playback" : "Fully ready playback"}</span>
                  </div>
                </div>

                <div className="preview-phone preview-phone--scene">
                  <div className="preview-phone__chrome">
                    <span className="preview-phone__dot" />
                    <span>{playback?.projectTitle}</span>
                  </div>

                  <div className="preview-phone__timeline">
                    {playback?.scenes.map((scene) => (
                      <section
                        className="preview-phone__timeline-scene"
                        key={scene.id}
                        style={{ minHeight: `${Math.max(240, Math.round((scene.durationMs ?? 2200) / 10))}px` }}
                      >
                        <PlaybackSceneRenderer scene={scene} isReducedMotion={playback.isReducedMotion} />

                        <div className="preview-phone__scene-overlay" />
                        <div className="preview-phone__scene-meta">
                          <span>{scene.title}</span>
                          <span>{scene.startsAtMs ?? 0} ms</span>
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              </section>

              {playback?.scenes.map((scene, index) => (
                <section className="preview-scene-section" key={scene.id}>
                  <div className="preview-scene-copy">
                    <p className="preview-scene-copy__eyebrow">{scene.title}</p>
                    <h2>{index === 0 ? "Opening frame" : "Next chapter"}</h2>
                    <p>{scene.detail}</p>
                    <div className="preview-scene-copy__badges">
                      <span>{scene.status}</span>
                      <span>{scene.durationMs ?? 2200} ms</span>
                      {scene.fallback ? <span>Fallback</span> : <span>Primary render</span>}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
