import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const supabase = createServiceClient()

// Create a new review (existing)
export async function POST(request: NextRequest) {
  try {
    const reviewData = await request.json()
    const { data, error } = await supabase
      .from('review_cycles')
      .insert([{ ...reviewData, status: 'SCHEDULED' }])
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Mark a review as complete
export async function PATCH(request: NextRequest) {
  try {
    const { review_id, advisor_notes, drift_assessment } = await request.json()

    if (!review_id) {
      return NextResponse.json({ error: 'Missing review_id' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('review_cycles')
      .update({
        status: 'COMPLETED',
        completed_date: new Date().toISOString(),
        advisor_notes: advisor_notes || null,
        drift_assessment: drift_assessment || null,
      })
      .eq('id', review_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
