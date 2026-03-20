import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Create a new behavioral flag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, date, market_context, client_behavior, advisor_response, severity, is_internal } = body

    if (!client_id || !market_context || !client_behavior) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('behavioral_flags')
      .insert([{
        client_id,
        date: date || new Date().toISOString(),
        market_context,
        client_behavior,
        advisor_response: advisor_response || null,
        severity: severity || 'MEDIUM',
        is_internal: is_internal ?? true,
        resolved: false,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Create flag error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Resolve a flag
export async function PATCH(request: NextRequest) {
  try {
    const { flag_id, resolved } = await request.json()

    if (!flag_id) {
      return NextResponse.json({ error: 'Missing flag_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('behavioral_flags')
      .update({ resolved })
      .eq('id', flag_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
