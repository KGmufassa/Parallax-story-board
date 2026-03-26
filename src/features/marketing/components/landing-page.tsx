import type { Route } from "next"
import Link from "next/link"

import { AppHeader } from "@/features/shared/components/app-header"
import type { AppIconName } from "@/features/shared/components/app-icon"
import { AppIcon } from "@/features/shared/components/app-icon"

const howItWorks: Array<{ title: string; body: string; image: string; icon: AppIconName }> = [
  {
    title: "1. Upload",
    body: "Upload supported image files and turn them into ordered project scenes.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArwtni54PHapKEODx6doVeYttx5JaLYaiyzVzVxJQCraahqK5B_ACiJgSbkrOLcC0ZbqdQlJx-rmd2kQvwG1-EmF8KTG_BSIYo2yCtVGJus5TvBwVYS7WrJ3JnXCtUMBlPz1qdSuHOYC4LNOj_r3vWDfZBB9cbaKIcArFrg7u_kogSE374avb2J-u14aSDUeL662VB7FPgqGTFOCa15hCh280wXjeXhlwM3PjWItwFYI0L_X0Q__ezWk4rLSks-Ou1shdfKq_SUDw",
    icon: "upload_file",
  },
  {
    title: "2. Build Scenes",
    body: "Add scene context, reorder the timeline, and keep the project moving from upload to ready.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD56SjIME50ktrzigeVWGdMX-zfGgaKhukwG41jVLRAGlXbcoJnWnzNuPUjyK7cswMh30ggMAuBet2puze3Vh25I9OUIvhfWyGDrNC40trQvpAppBfWXuYrwhNsFVoo2erQ04lPcVx-AbU_TGVVs-q_BaFiIGCrxJt1p3GWgk4D_ICRLDnGz07XgC5lZ42Q7BfJRwtxqquFrZMTI1Kq-MZjXHo2bH_lFDPbhB1VZwE6haRVpEc1I04HZC85dg4owW67kFcm2BQswkM",
    icon: "stack",
  },
  {
    title: "3. Motion Direction",
    body: "Choose motion presets and intensity per scene before queueing generation or retrying failures.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgxdharMz3IZdeOQyRQ9KI3S0s7fkz7j13d5b_M_lUVzltbfbU9u7El40vNINGJSrtWoNCPRNb5ll5OFOMQ0V_pmLCb6fvbCGmd5tTBMy3G3Q2AvMdkOI6XbpALrGJZiMqDIKiyUo1lYImI1l7alXRYKt6DAuLMLpnWyw-BLQpHn3_9t0RiaJ1q0ed4jcNOgdHzKbO9Y6Wu9lKkAHrV3gogS7xD480bdBvTePyxAnUgAlNNA-JYlwJ-VtBCoNfJjw0K--ml_ONqjQ",
    icon: "movie_edit",
  },
  {
    title: "4. Preview Story",
    body: "Review a stitched mobile preview that stays usable even when only some scenes are ready.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBIp7VIb2LyIPZtzjv8G9rIVxe5qQJYbhBdjZlodEMmiNj50qo4JzhLchvFzvbLKuyJS_TK7faZrfoGYFW2WQ3lAN0BwHQLHlvV-eo8nG6GLLOw8QiKAf1IdixT3zOTfFwKlhOPRWtaGoWBEdYTiMxYkFV9HN2Y-B4C4Zk-6KQ1iCiEMlTK7i63DDWST7Ali3WkrxxLMngB4PMRaSTwdSvThtrnt4GlAqGM7s9Ad9CdnKo1aWw_5z5ZVEXT2KTKXa7DH2UIMjk8ddc",
    icon: "play_circle",
  },
]

const footerProductLinks = ["Projects", "Editor", "Preview", "Guest Access"]
const footerResourceLinks = ["Local Setup", "Health Checks", "Auth", "Support"]
const featureItems: Array<{ icon: AppIconName; title: string; body: string }> = [
  {
    icon: "view_quilt",
    title: "Scene Manager",
    body: "Organize uploads into a real ordered timeline with editable scene metadata and status visibility.",
  },
  {
    icon: "auto_fix_high",
    title: "Generation Pipeline",
    body: "Queue scene processing, retry failed work, and keep partially ready projects previewable.",
  },
  {
    icon: "draw",
    title: "Editor Controls",
    body: "Update project context, style hints, motion preset, and intensity from the editor instead of mock controls.",
  },
  {
    icon: "swipe_down_alt",
    title: "Stitched Preview",
    body: "Use the current MVP player to inspect scene order, timing, and fallback playback on mobile-sized layouts.",
  },
]

export function LandingPage() {
  return (
    <main className="psc-screen psc-screen--landing">
      <AppHeader variant="marketing" />

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <div className="landing-badge">
            <span className="landing-badge__dot" />
            MVP Story Workflow
          </div>
          <h1 className="landing-hero__title">
            Turn Still Images into <span>Previewable</span> Parallax Stories
          </h1>
          <p className="landing-hero__lede">
            Upload images, shape scene-by-scene motion, and review a stitched vertical preview.
            The current launch path focuses on uploads, editing, preview, and guest-to-account
            claiming instead of full export tooling.
          </p>
          <div className="landing-hero__actions">
            <Link className="landing-button landing-button--primary" href={"/projects/new" as Route}>
              Start Free as Guest
            </Link>
            <Link className="landing-button landing-button--secondary" href={"/signup" as Route}>
              Create Account
            </Link>
          </div>
          <Link className="landing-inline-link" href={"/login" as Route}>
            Already have an account? Log In
          </Link>
        </div>

        <div className="landing-hero__visual-wrap">
          <div className="landing-hero__visual-glow" />
          <div className="landing-phone-frame">
            <div
              className="landing-phone-frame__image"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuARa_R0UxUaViwpyRxqB6fNeCk4IoirR9zhAJfhXpo8vf--Dw0n1DOWlMwLt6A4Wsf9ON5qNiwuJE5qUvPJZrpAewg46MfAz7PyYBWfqpquJB5fNJ5QiQsPxT_zW7qR4sVQB-uiQPcba5TCVqVe6zouhN6s5oqp-ttaBiD9wbzFaQhjrMoJ7xdoZR2x8T-O3WLHPueOoi9OLSmOA0XG4ScsaQzxQlj-J58Sj_R0t3weAFme-XX8-p1b9d3hcTmo4BqTnpDYGd9XpK8")',
              }}
            />
            <div className="landing-phone-frame__gradient" />
            <div className="landing-phone-frame__top-row">
              <div className="landing-phone-frame__scene-label">Scene 01: The Peak</div>
              <div className="landing-phone-frame__icon">
                <AppIcon className="landing-phone-frame__icon-svg" name="layers" />
              </div>
            </div>
            <svg className="landing-phone-frame__path" viewBox="0 0 400 700">
              <path d="M50,600 C150,550 250,650 350,500" fill="none" stroke="#38f91a" strokeDasharray="8 8" strokeWidth="2" />
              <circle cx="350" cy="500" fill="#38f91a" r="6" />
              <text fill="#38f91a" fontSize="12" fontWeight="bold" x="310" y="485">
                PAN END
              </text>
            </svg>
            <div className="landing-phone-frame__bottom">
              <div className="landing-phone-frame__progress">
                <div className="landing-phone-frame__progress-bar" />
              </div>
              <div className="landing-phone-frame__player-row">
                <span>00:12:45</span>
                <div className="landing-phone-frame__player-icons">
                  <AppIcon className="landing-player-icon" name="fast_rewind" />
                  <AppIcon className="landing-player-icon landing-player-icon--primary" name="play_arrow" />
                  <AppIcon className="landing-player-icon" name="fast_forward" />
                </div>
                <span>00:20:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--surface">
        <div className="landing-section__heading">
          <h2>How It Works</h2>
          <p>Master the art of visual storytelling in four simple steps</p>
        </div>
        <div className="landing-steps-grid">
          {howItWorks.map((step) => (
            <article className="landing-step" key={step.title}>
              <div className="landing-step__image" style={{ backgroundImage: `url("${step.image}")` }}>
                <div className="landing-step__icon-wrap">
                  <AppIcon className="landing-step__icon" name={step.icon} />
                </div>
              </div>
              <div className="landing-step__copy">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--features">
        <div>
          <h2 className="landing-feature-title">Pro Tools for Immersive Motion</h2>
          <div className="landing-feature-grid">
            {featureItems.map(({ icon, title, body }) => (
              <article className="landing-feature-item" key={title}>
                <AppIcon className="landing-feature-item__icon" name={icon} />
                <h4>{title}</h4>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="landing-guest-card">
          <div className="landing-guest-card__header">
            <div className="landing-guest-card__icon">
              <AppIcon className="landing-guest-card__icon-svg" name="info" />
            </div>
            <div>
              <h3>GUEST ACCESS</h3>
              <p>Guest workflow enabled</p>
            </div>
          </div>
          <ul className="landing-guest-card__list">
            <li><AppIcon className="landing-guest-card__list-icon" name="check_circle" /> Create projects and upload scene images</li>
            <li><AppIcon className="landing-guest-card__list-icon" name="check_circle" /> Edit scene context and motion settings</li>
            <li className="is-locked"><AppIcon className="landing-guest-card__list-icon" name="lock" /> Claim projects to an account for long-term ownership</li>
            <li className="is-locked"><AppIcon className="landing-guest-card__list-icon" name="lock" /> Export remains out of scope for the MVP</li>
          </ul>
          <Link className="landing-button landing-button--ghost" href={"/signup" as Route}>
            Claim Your Workspace
          </Link>
        </aside>
      </section>

      <section className="landing-final-cta">
        <h2>Ready to bring your images to life?</h2>
        <p>Start the guest workflow now, then claim the project later if you want to keep it beyond the guest lifecycle.</p>
        <Link className="landing-button landing-button--primary landing-button--large" href={"/projects/new" as Route}>
          Create Your Story
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <div className="landing-footer__logo-row">
              <div className="landing-footer__logo">
                <AppIcon className="landing-footer__logo-icon" name="layers" />
              </div>
              <h3>Parallax Story Composer</h3>
            </div>
            <p>
              An MVP workflow for uploads, scene editing, stitched preview, and guest-to-account
              claiming.
            </p>
            <div className="landing-footer__socials">
              <Link className="landing-footer__social" href={"/projects" as Route}>
                <AppIcon className="landing-footer__social-icon" name="public" />
              </Link>
              <Link className="landing-footer__social" href={"/projects/new" as Route}>
                <AppIcon className="landing-footer__social-icon" name="video_library" />
              </Link>
            </div>
          </div>
          <div>
            <h4>Product</h4>
            <ul className="landing-footer__links">
              {footerProductLinks.map((item) => (
                <li key={item}>
                  <span className="landing-footer__link">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul className="landing-footer__links">
              {footerResourceLinks.map((item) => (
                <li key={item}>
                  <span className="landing-footer__link">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <p>© 2024 Parallax Story Composer. All rights reserved.</p>
          <div>
            <span className="landing-footer__meta-link">Privacy and legal pages ship after MVP launch.</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
