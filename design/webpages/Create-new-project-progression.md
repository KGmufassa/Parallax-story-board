# Create New Project Progression

This document describes what happens after a user uploads their desired images and clicks `Create Project` on the new project page.

## Progression

1. The form submission starts in the browser.
- The `Create Project` button triggers the form submit handler in `src/features/projects/components/new-project-form.tsx`.
- The page stays in-app and does not perform a full browser reload.

2. The app validates the required inputs.
- It checks that the project title is not empty.
- It checks that at least one image has been uploaded.
- If either check fails, the flow stops and an error message is shown to the user.

3. The UI switches into a submitting state.
- The submit button becomes disabled.
- The button label changes to `Creating Project...`.
- Any previous error state is cleared.

4. The app begins project creation.
- A progress message appears: `Creating project shell...`.
- The client sends a `POST` request to `/api/v1/projects` with:
  - `title`
  - `globalContext`
  - `stylePreset`

5. Guest-session recovery happens if needed.
- If the create-project request returns `401`, the client creates a guest session with `POST /api/v1/guest-sessions`.
- The app then retries the project creation request automatically.

6. The server returns the new project ID.
- The response includes the created project identifier.
- That ID is used for the upload initialization and final redirect.

7. The app prepares upload contracts.
- A progress message appears: `Preparing upload slots...`.
- The client sends `POST /api/v1/projects/{projectId}/uploads/init`.
- The request includes file metadata for each uploaded image:
  - `filename`
  - `mimeType`
  - `sizeBytes`

8. The server returns upload destinations.
- The response includes one upload contract per image.
- Each contract contains values such as:
  - `uploadToken`
  - `uploadUrl`
  - `storageKey`
  - `expiresAt`

9. The app uploads the selected image files.
- A progress message appears: `Uploading images to the scene queue...`.
- The client uploads each file directly with a `PUT` request to its `uploadUrl`.
- These uploads run in parallel.

10. The app finalizes the uploaded scene order.
- A progress message appears: `Finalizing scene order...`.
- The client sends `POST /api/v1/projects/{projectId}/uploads/finalize`.
- The request includes, for each image:
  - `uploadToken`
  - `originalFilename`
  - `mimeType`
  - `sizeBytes`
  - `width`
  - `height`

11. The scene sequence preserves the user's chosen order.
- The uploaded image order comes from the current `queueItems` list.
- If the user reordered images before submitting, that order becomes the initial scene order in the project.

12. The app completes the creation flow.
- A progress message appears: `Project ready. Opening the editor...`.

13. The user is redirected into the project editor.
- The client navigates to `/projects/{projectId}/editor`.

14. The editor route loads the new project.
- The editor page fetches:
  - `/api/v1/projects/{projectId}`
  - `/api/v1/auth/session`
- It loads the project title, context, style preset, and scenes into the editing UI.

15. The uploaded images now appear as editable scenes.
- The first uploaded scene becomes the active scene by default.
- The user can continue editing, upload more images, save changes, or open preview.

16. Guest users remain in a guest workflow.
- If the user is a guest, the editor shows a notice explaining that the project remains editable for the current session and can be claimed later.

## Source References

- `src/features/projects/components/new-project-form.tsx`
- `src/app/projects/[projectId]/editor/page.tsx`
- `src/features/projects/components/project-editor-page.tsx`
