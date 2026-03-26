import { AuthPage } from "@/features/auth/components/auth-page"
import { getAuthConfigEnv } from "@/config/env"

type SignupPageProps = {
  searchParams: Promise<{
    callbackUrl?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const env = getAuthConfigEnv()
  const params = await searchParams
  return <AuthPage callbackUrl={params.callbackUrl} googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)} mode="signup" />
}
