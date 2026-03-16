import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // email confirmation uses token_hash + type
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  if (token_hash && type) {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) return NextResponse.redirect(`${origin}/dashboard`)
  }

  // fallback
  return NextResponse.redirect(`${origin}/auth`)
}
