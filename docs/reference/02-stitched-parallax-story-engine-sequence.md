# Stitched Parallax Story Engine Sequence

This document maps the stitched parallax storyboard flow across frontend, API, backend services, processing, and playback.

## Sequence Overview

1. Frontend: project creation starts.
- The user submits the new project form at `/projects/new`.
- The client creates the project and uploads source images.

2. API: uploads are finalized into scenes.
- `POST /api/v1/projects/[projectId]/uploads/finalize`
- The finalize route creates scene records in the selected order.

3. Backend: thumbnails are created.
- The source upload is copied into a thumbnail path for editor and preview use.

4. Backend: scene decomposition jobs are enqueued.
- Each created scene is queued for decomposition.
- The scene status moves to `queued`.

5. Processing layer: decomposition is dispatched.
- The processing service dispatches a decomposition job for each scene.
- In local development, the dev trigger runs the decomposition flow.

6. Decomposition layer: the source image is pushed into Qwen.
- The decomposition adapter receives:
  - `projectId`
  - `sceneId`
  - `imageUrl`
  - `mimeType`
  - `width`
  - `height`
  - `targetLayers`
  - `correlationId`

7. Qwen returns decomposition output.
- The provider returns separated scene layers and related metadata.
- These layers represent the scene elements used for parallax depth.

8. Asset layer: returned scene assets are persisted.
- The backend stores the returned decomposition layer assets.
- Those assets are attached to the scene.

9. Motion layer: the scene motion blueprint is generated.
- Motion is derived from scene settings and returned decomposition assets.
- The motion blueprint includes:
  - camera movement
  - intensity
  - per-layer parallax
  - scale
  - opacity
  - transition settings

10. Scene state is updated.
- The scene moves through:
  - `queued`
  - `processing`
  - `ready`

11. Playback layer: the project is stitched.
- The playback service reads all current scenes for the project.
- It builds a timeline with:
  - order
  - start times
  - durations
  - overlaps
  - image URLs
  - camera movement
  - intensity
  - layer behaviors
  - fallback state

12. Playback plans are persisted.
- The stitched playback plan is saved as the current playback version for the project.

13. Editor: the user opens the editor.
- The editor loads project and scene data.
- It reflects the scene states while processing continues.

14. Preview: the user opens stitched playback.
- `GET /api/v1/projects/[projectId]/preview/playback`
- The preview controller returns the latest playback plan.

15. Frontend preview consumes the playback plan.
- The preview page normalizes the playback response.
- It renders a stitched vertical scene sequence using timing and image data.

16. User edits feed the loop again.
- Scene updates, reorder, retry, regenerate, uploads, and deletion can re-enter the pipeline.
- The intended long-term editor connection is to keep the editor aligned with this same playback output.

## Layer Responsibilities

### Frontend
- Collect project and scene inputs.
- Upload source images.
- Display scene state, editor state, and preview state.

### API Layer
- Validate requests.
- Enforce access.
- Route uploads, scene creation, preview playback, and scene processing actions.

### Scene And Processing Layer
- Create scenes from finalized uploads.
- Queue and track decomposition jobs.
- Transition scene state through queued, processing, ready, or failed.

### Decomposition Layer
- Push source images into Qwen.
- Receive decomposed layer assets.
- Return provider metadata.

### Motion Layer
- Generate motion blueprints from scene settings and layer structure.
- Define per-layer parallax and movement behavior.

### Playback Layer
- Stitch scenes into one ordered playback plan.
- Support fallback and reduced-motion output.

## Current Engine Truth

The current parallax engine contract is the combination of:
- decomposition assets returned from Qwen
- scene motion blueprints
- stitched playback plans

The preview page already consumes this engine output. The editor should connect to the same output rather than implementing a separate playback model.
