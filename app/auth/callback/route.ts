import { createSupabaseServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const plan = requestUrl.searchParams.get('plan')

  if (code) {
    const supabase = createSupabaseServerClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=auth_callback_error`)
      }

      // If user signed up with a specific plan, redirect to checkout
      if (plan && plan !== 'free') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard/billing?plan=${plan}`)
      }

      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=server_error`)
    }
  }

  // No code provided, redirect to sign in
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin`)
}
