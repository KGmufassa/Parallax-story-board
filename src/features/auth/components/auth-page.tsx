"use client"

import { useMemo, useState, type FormEvent } from "react"
import type { Route } from "next"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

import { AppHeader } from "@/features/shared/components/app-header"
import { AppIcon } from "@/features/shared/components/app-icon"

type AuthPageProps = {
  mode: "login" | "signup"
  googleEnabled?: boolean
  callbackUrl?: string
}

type RegisterResponse = {
  id: string
}

type ApiEnvelope<T> = {
  data: T
}

type ApiErrorEnvelope = {
  error?: {
    message?: string
  }
}

async function parseJsonResponse<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | ApiErrorEnvelope | null

  if (!response.ok) {
    throw new Error(payload && "error" in payload ? payload.error?.message ?? "Request failed." : "Request failed.")
  }

  if (!payload || !("data" in payload)) {
    throw new Error("Unexpected response from the server.")
  }

  return payload.data
}

export function AuthPage({ mode, googleEnabled = false, callbackUrl = "/projects" }: AuthPageProps) {
  const router = useRouter()
  const isLogin = mode === "login"
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberDevice, setRememberDevice] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const benefits = useMemo(
    () => [
      {
        icon: "cloud_upload" as const,
        title: "Live Project Sync",
        body: "Keep projects, scene edits, and preview-ready uploads in one place across guest and signed-in flows.",
      },
      {
        icon: "file_export" as const,
        title: "Preview And Claim",
        body: "Sign in to claim guest work, keep saving safely, and unlock authenticated-only export messaging.",
      },
      {
        icon: "group" as const,
        title: "MVP Studio Access",
        body: "Use the same credentials flow the app actually supports today, with Google available only when configured.",
      },
    ],
    [],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        })

        if (!result || result.error) {
          throw new Error("Email or password is incorrect.")
        }

        window.location.assign(result.url || callbackUrl)
        router.refresh()
        return
      }

      await parseJsonResponse<RegisterResponse>(
        await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: displayName.trim() || undefined,
            email,
            password,
            rememberDevice,
          }),
        }),
      )

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!loginResult || loginResult.error) {
        throw new Error("Account created, but automatic sign-in failed. Please log in.")
      }

      window.location.assign(loginResult.url || callbackUrl)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-screen">
      <AppHeader variant="auth" />
      <div className="auth-layout">
        <section className="auth-side-panel">
          <div className="auth-side-panel__content">
            <div className="auth-side-panel__brand">
              <AppIcon className="auth-brand-icon" name="storm" />
              <h1>Parallax Story Composer</h1>
            </div>
            <div className="auth-side-panel__stack">
              <h2>
                Build stories that <span>actually ship</span>.
              </h2>
              <div className="auth-benefit-list">
                {benefits.map(({ icon, title, body }) => (
                  <article className="auth-benefit" key={title}>
                    <div className="auth-benefit__icon">
                      <AppIcon className="auth-benefit__icon-svg" name={icon} />
                    </div>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
          <div className="auth-side-panel__bg" />
          <p className="auth-side-panel__footer">© 2024 Parallax Story Composer. Credentials-first MVP access.</p>
        </section>

        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand">
              <AppIcon className="auth-brand-icon auth-brand-icon--mobile" name="storm" />
              <span>Parallax</span>
            </div>

            <div className="auth-tabs">
              <Link className={isLogin ? "auth-tabs__item is-active" : "auth-tabs__item"} href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}` as Route}>
                Log In
              </Link>
              <Link className={!isLogin ? "auth-tabs__item is-active" : "auth-tabs__item"} href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` as Route}>
                Sign Up
              </Link>
            </div>

            <div className="auth-card">
              <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
              <p className="auth-card__lede">
                {isLogin
                  ? "Log in with credentials to open your projects, claim guest work, and keep editing."
                  : "Create a credentials account, then land directly in your project workspace."}
              </p>
              {!googleEnabled ? <p className="auth-card__lede">Google sign-in is off unless both Google provider secrets are configured for this deployment.</p> : null}

              {googleEnabled ? (
                <button
                  className="auth-google-button"
                  onClick={() => void signIn("google", { callbackUrl })}
                  type="button"
                >
                  <svg className="auth-google-button__icon" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              ) : null}

              {googleEnabled ? (
                <div className="auth-divider">
                  <span>Or continue with</span>
                </div>
              ) : null}

              <form className="auth-form" onSubmit={handleSubmit}>
                {!isLogin ? (
                  <label className="auth-field">
                    <span>Display Name</span>
                    <input onChange={(event) => setDisplayName(event.target.value)} placeholder="Alex Creator" type="text" value={displayName} />
                  </label>
                ) : null}

                <label className="auth-field">
                  <span>Email Address</span>
                  <input onChange={(event) => setEmail(event.target.value)} placeholder="name@studio.com" required type="email" value={email} />
                </label>

                <div className="auth-field">
                  <div className="auth-field__row">
                    <span>Password</span>
                  </div>
                  <div className="auth-password-wrap">
                    <input onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
                  </div>
                </div>

                <label className="auth-checkbox-row">
                  <input checked={rememberDevice} onChange={(event) => setRememberDevice(event.target.checked)} type="checkbox" />
                  <span>Remember this device</span>
                </label>

                {errorMessage ? <p className="new-project-error">{errorMessage}</p> : null}

                <button className="auth-submit-button" disabled={isSubmitting} type="submit">
                  {isSubmitting ? (isLogin ? "Entering Studio..." : "Creating Account...") : isLogin ? "Enter Studio" : "Create Account"}
                </button>
              </form>

              <p className="auth-card__footer">
                {isLogin ? "New to Parallax? " : "Already have an account? "}
                <Link href={((isLogin ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`) as Route)}>
                  {isLogin ? "Create an account" : "Log In"}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
