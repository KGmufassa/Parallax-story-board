# Stitched Parallax Story Product Flow

This document describes the end-to-end user journey for creating a stitched parallax storyboard in the current app.

## End-To-End User Progression

1. The user lands on the app.
- They understand the product promise: upload still images, shape scenes, and preview a stitched parallax story.
- They continue as guest or sign in.

2. The user starts a new project.
- They enter from the home page, projects page, or top navigation.
- They arrive at `/projects/new`.

3. The user sets up the project.
- They enter a project title.
- They optionally add global context.
- They optionally choose a style preset.

4. The user uploads source images.
- They select one or more images.
- The images appear in the upload queue.

5. The user arranges the initial storyboard order.
- They drag images into the intended sequence.
- That order becomes the initial scene order.

6. The user clicks `Create Project`.
- The app creates the project record.
- If needed, it creates a guest session first.

7. The app prepares upload slots.
- The app requests upload contracts for each image.
- Each image receives an upload token and upload destination.

8. The app uploads the raw source files.
- The selected images are uploaded into project storage.
- These are the original source assets for the new scenes.

9. The app finalizes the uploads as scenes.
- Each uploaded image becomes a scene record.
- The selected order becomes the initial scene timeline order.
- A thumbnail copy is created for editor and preview use.

10. The app automatically queues decomposition for each scene.
- Every new scene is enqueued for background processing.
- The storyboard exists immediately, but deeper processing continues asynchronously.

11. Each scene image is sent into the Qwen image decomposition pipeline.
- The decomposition pipeline receives the scene source image and metadata.
- This is the step where the flat image is prepared for depth-based playback.

12. Qwen separates the image into layered scene elements.
- Foreground and background style elements are split into layer assets.
- These returned assets become the basis for parallax behavior.

13. The returned decomposition assets are stored back in the app.
- The backend persists the returned scene assets.
- The scene now has source, thumbnail, and decomposition layer assets.

14. The scene progresses through processing states.
- The scene moves from `queued` to `processing` to `ready`.
- Users can see that the storyboard is progressively becoming playback-ready.

15. The app generates motion behavior for the returned layers.
- A motion blueprint is generated for each processed scene.
- This defines camera movement, intensity, layer parallax, scale, opacity, and transitions.

16. The project is stitched into a playback timeline.
- The playback service builds the stitched timeline for the project.
- Scene order, duration, overlap, timing, movement, and fallback behavior are assembled into one playback plan.

17. The user enters the editor workspace.
- They arrive at `/projects/[projectId]/editor`.
- They can see the project shell, scene list, and current processing states.

18. The user refines the storyboard scene by scene.
- They edit scene context.
- They choose motion preset and motion intensity.
- They may upload more images later.

19. The user monitors scenes as they become ready.
- Some scenes may still be queued or processing.
- Other scenes may already be ready for playback.

20. The returned layered assets and motion settings drive the parallax engine.
- The parallax experience is no longer based only on the original flat image.
- It is based on decomposition layer assets plus motion blueprint data.

21. The user opens preview.
- They go to `/projects/[projectId]/preview`.
- The app loads the stitched playback plan for the project.

22. The user sees the stitched parallax storyboard.
- The preview presents a continuous vertical playback experience.
- If some scenes are still incomplete, fallback playback can still show renderable scenes.

23. The user evaluates pacing, depth, and continuity.
- They assess story order, motion, timing, and transitions.
- They decide whether more edits are needed.

24. The user returns to the editor for revisions.
- They adjust scene settings or project direction.
- They retry or regenerate scenes if needed.
- They preview again.

25. The user reaches a finished stitched story.
- Images have been uploaded.
- Scenes have been created.
- Qwen has decomposed scene elements.
- Returned assets have been stored.
- Motion has been generated.
- Playback has been stitched.
- The project is previewable as a continuous parallax story.

## Core Creation Loop

1. Upload source image.
2. Create scene.
3. Enqueue decomposition.
4. Send image to Qwen.
5. Qwen separates image elements into layers.
6. Return those layers to the app.
7. Store them on the scene.
8. Generate motion blueprint.
9. Stitch playback timeline.
10. Preview the parallax storyboard.
