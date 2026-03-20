import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get client profile
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (clientError) {
      console.error('Client fetch error:', clientError)
      return NextResponse.json({ error: 'Failed to fetch client', detail: clientError.message }, { status: 500 })
    }

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get advisor info using advisor_id from the client record
    const { data: advisor } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', client.advisor_id)
      .maybeSingle()

    // Get goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    // Get decisions (non-internal only)
    const { data: decisions } = await supabase
      .from('decision_log')
      .select('*')
      .eq('client_id', client.id)
      .eq('is_internal', false)
      .order('date', { ascending: false })

    // Get next scheduled review
    const { data: nextReview } = await supabase
      .from('review_cycles')
      .select('*')
      .eq('client_id', client.id)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      client,
      advisor,
      goals: goals || [],
      decisions: decisions || [],
      nextReview: nextReview || null,
    })
  } catch (error: any) {
    console.error('Client portal error:', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}