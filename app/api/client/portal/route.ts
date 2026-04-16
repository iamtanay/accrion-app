import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createServiceClient()
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

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

    const [
      advisorRes,
      goalsRes,
      decisionsRes,
      nextReviewRes,
      pastReviewsRes,
      documentsRes,
      snapshotsRes,
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email')
        .eq('id', client.advisor_id)
        .maybeSingle(),
      supabase
        .from('goals')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('decision_log')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_internal', false)
        .order('date', { ascending: false }),
      supabase
        .from('review_cycles')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'SCHEDULED')
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('review_cycles')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'COMPLETED')
        .order('scheduled_date', { ascending: false })
        .limit(10),
      supabase
        .from('documents')
        .select('*')
        .eq('client_id', client.id)
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('behavioral_snapshots')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(5),
    ])

    return NextResponse.json({
      client,
      advisor: advisorRes.data,
      goals: goalsRes.data || [],
      decisions: decisionsRes.data || [],
      nextReview: nextReviewRes.data || null,
      pastReviews: pastReviewsRes.data || [],
      documents: documentsRes.data || [],
      snapshots: snapshotsRes.data || [],
    })
  } catch (error: any) {
    console.error('Client portal error:', error)
    return NextResponse.json({ error: 'Internal server error', detail: error.message }, { status: 500 })
  }
}
