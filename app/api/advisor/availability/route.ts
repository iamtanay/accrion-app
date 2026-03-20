import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { addDays, format, setHours, setMinutes, isAfter, isBefore } from 'date-fns'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const advisorId = searchParams.get('advisorId')
  const daysAhead = parseInt(searchParams.get('days') || '21')
  const excludeReviewId = searchParams.get('exclude_review_id')

  if (!advisorId) {
    return NextResponse.json({ error: 'advisorId required' }, { status: 400 })
  }

  try {
    const today = new Date()
    const rangeEnd = addDays(today, daysAhead)

    // 1. Get advisor weekly availability
    const { data: availability, error: availError } = await supabase
      .from('advisor_availability')
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('is_active', true)

    if (availError) throw availError
    if (!availability || availability.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // 2. Get all client IDs belonging to this advisor
    const { data: advisorClients } = await supabase
      .from('clients')
      .select('id')
      .eq('advisor_id', advisorId)

    const clientIds = (advisorClients || []).map((c: any) => c.id)

    // 3. Get booked slots — only SCHEDULED rows count as taken
    //    If exclude_review_id is passed (reschedule flow), that row's slot is freed up
    let booked: any[] = []
    if (clientIds.length > 0) {
      let query = supabase
        .from('review_cycles')
        .select('id, scheduled_date')
        .in('client_id', clientIds)
        .eq('status', 'SCHEDULED')
        .gte('scheduled_date', today.toISOString())
        .lte('scheduled_date', rangeEnd.toISOString())

      if (excludeReviewId) {
        query = query.neq('id', excludeReviewId)
      }

      const { data: bookedData } = await query
      booked = bookedData || []
    }

    const bookedSet = new Set<string>()
    booked.forEach((r: any) => {
      const d = new Date(r.scheduled_date)
      bookedSet.add(`${format(d, 'yyyy-MM-dd')}_${format(d, 'HH:mm')}`)
    })

    // 4. Build availability map: dayOfWeek -> { start, end }
    const availMap: Record<number, { start: string; end: string }> = {}
    availability.forEach((a: any) => {
      availMap[a.day_of_week] = { start: a.start_time, end: a.end_time }
    })

    // 5. Generate all 1-hour slots
    const slots: { date: string; time: string; datetime: string; label: string }[] = []

    let cursor = addDays(today, 1)
    while (isBefore(cursor, rangeEnd)) {
      const dow = cursor.getDay()
      if (availMap[dow]) {
        const { start, end } = availMap[dow]
        const [sh, sm] = start.split(':').map(Number)
        const [eh, em] = end.split(':').map(Number)

        let slotStart = setMinutes(setHours(new Date(cursor), sh), sm)
        const dayEnd = setMinutes(setHours(new Date(cursor), eh), em)

        while (isBefore(slotStart, dayEnd)) {
          const dateStr = format(slotStart, 'yyyy-MM-dd')
          const timeStr = format(slotStart, 'HH:mm')
          const key = `${dateStr}_${timeStr}`

          if (!bookedSet.has(key) && isAfter(slotStart, today)) {
            slots.push({
              date: dateStr,
              time: timeStr,
              datetime: slotStart.toISOString(),
              label: format(slotStart, 'h:mm a'),
            })
          }
          slotStart = new Date(slotStart.getTime() + 60 * 60 * 1000)
        }
      }
      cursor = addDays(cursor, 1)
    }

    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error('Availability error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
