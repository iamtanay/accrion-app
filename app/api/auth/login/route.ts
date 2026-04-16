import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Build the response object we will mutate with session cookies
    const response = NextResponse.json({ ok: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = data.user
    let role: string = user.user_metadata?.role ?? ''
    let name: string = user.user_metadata?.name ?? ''

    // If role not in metadata yet, look it up from the users mirror table
    if (!role) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('role, name')
        .eq('email', user.email)
        .maybeSingle()

      role = dbUser?.role ?? 'CLIENT'
      name = dbUser?.name ?? (user.email ?? '')

      // Persist role into metadata so future logins are fast
      await supabase.auth.updateUser({ data: { role, name } })
    }

    // Return user info in body so the client can redirect correctly
    const successResponse = NextResponse.json({
      id: user.id,
      email: user.email,
      name,
      role,
    })

    // Copy session cookies onto the success response
    response.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value)
    })

    return successResponse
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// Sign-out endpoint
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.signOut()
  return response
}
