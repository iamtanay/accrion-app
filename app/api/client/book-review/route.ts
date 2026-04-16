import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Book or reschedule a review
export async function POST(request: Request) {
  const supabase = createServiceClient()
  try {
    const { client_id, advisor_id, scheduled_datetime, reschedule_id } = await request.json()

    if (!client_id || !scheduled_datetime) {
      return NextResponse.json({ error: 'Missing client_id or scheduled_datetime' }, { status: 400 })
    }

    const slotStart = new Date(scheduled_datetime)

    // Resolve advisor_id from client if not provided
    const { data: clientRecord } = await supabase
      .from('clients')
      .select('id, advisor_id')
      .eq('id', client_id)
      .maybeSingle()

    if (!clientRecord) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const resolvedAdvisorId = advisor_id || clientRecord.advisor_id

    // Check for conflicts — exclude the row being rescheduled
    const { data: advisorClients } = await supabase
      .from('clients')
      .select('id')
      .eq('advisor_id', resolvedAdvisorId)

    const clientIds = (advisorClients || []).map((c: any) => c.id)
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

    if (clientIds.length > 0) {
      let conflictQuery = supabase
        .from('review_cycles')
        .select('id')
        .in('client_id', clientIds)
        .eq('status', 'SCHEDULED')
        .gte('scheduled_date', slotStart.toISOString())
        .lt('scheduled_date', slotEnd.toISOString())

      if (reschedule_id) {
        conflictQuery = conflictQuery.neq('id', reschedule_id)
      }

      const { data: conflict } = await conflictQuery.limit(1)
      if (conflict && conflict.length > 0) {
        return NextResponse.json(
          { error: 'This slot was just booked by someone else. Please choose another time.' },
          { status: 409 }
        )
      }
    }

    // If rescheduling — delete the old row
    if (reschedule_id) {
      const { error: deleteError } = await supabase
        .from('review_cycles')
        .delete()
        .eq('id', reschedule_id)

      if (deleteError) throw deleteError
    }

    // Create new review row
    const { data: review, error } = await supabase
      .from('review_cycles')
      .insert([{
        client_id,
        scheduled_date: slotStart.toISOString(),
        status: 'SCHEDULED',
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error('Book review error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Cancel — just delete the row
export async function DELETE(request: Request) {
  const supabase = createServiceClient()
  try {
    const { review_id } = await request.json()

    if (!review_id) {
      return NextResponse.json({ error: 'Missing review_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('review_cycles')
      .delete()
      .eq('id', review_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
