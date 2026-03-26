import { AppHeader } from "@/features/shared/components/app-header"

export function SettingsPage() {
  return (
    <main className="settings-screen">
      <AppHeader active="settings" />

      <section className="settings-shell">
        <div className="settings-header">
          <span className="settings-kicker">Deferred for MVP</span>
          <h1>Settings are not part of the launch flow</h1>
          <p>The core MVP experience lives in projects, uploads, editor updates, preview, and guest-to-account claiming.</p>
        </div>

        <div className="settings-stack">
          <section className="settings-panel settings-panel--account">
            <div className="settings-panel__heading">
              <div>
                <h2>Coming after MVP</h2>
                <p>Account preferences, saved defaults, and session management are intentionally deferred until the core editor and preview flow is stable.</p>
              </div>
            </div>
          </section>

          <section className="settings-panel">
            <div className="settings-panel__heading">
              <div>
                <h2>What to use instead</h2>
                <p>Use Projects for active work, the editor for uploads and scene updates, and preview to verify stitched playback before sharing access internally.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
