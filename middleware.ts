import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a response we can mutate (to refresh session cookies)
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired — MUST happen before any auth checks
  const { data: { user } } = await supabase.auth.getUser()

  // ── Public routes — always allowed ───────────────────────────────────────
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) return response

  // ── Protected: must be authenticated ─────────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based route guards ───────────────────────────────────────────────
  // We store the role in user_metadata (set during sign-up / user creation)
  const role = user.user_metadata?.role as string | undefined

  if (pathname.startsWith('/advisor') && role !== 'ADVISOR') {
    // Authenticated but wrong role — send to their own area
    return NextResponse.redirect(new URL('/client/portal', request.url))
  }

  if (pathname.startsWith('/client') && role !== 'CLIENT') {
    return NextResponse.redirect(new URL('/advisor/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.svg / public assets
     */
    '/((?!_next/static|_next/image|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
