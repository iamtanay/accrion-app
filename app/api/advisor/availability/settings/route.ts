import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const supabase = createServiceClient()

// GET: fetch current availability for an advisor
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const advisorId = searchParams.get('advisorId')

  if (!advisorId) {
    return NextResponse.json({ error: 'advisorId required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('advisor_availability')
    .select('*')
    .eq('advisor_id', advisorId)
    .order('day_of_week')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ availability: data || [] })
}

// POST: upsert all 7 days of availability for an advisor
export async function POST(request: Request) {
  try {
    const { advisorId, availability } = await request.json()

    if (!advisorId || !availability) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const rows = availability.map((d: any) => ({
      advisor_id: advisorId,
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      is_active: d.is_active,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('advisor_availability')
      .upsert(rows, { onConflict: 'advisor_id,day_of_week' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
