import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const supabase = createServiceClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

    let result

    switch (type) {
      case 'goal': {
        const { error, data: row } = await supabase
          .from('goals')
          .insert([{
            client_id: data.client_id,
            title: data.title,
            description: data.description || null,
            target_amount: data.target_amount || null,
            target_date: data.target_date || null,
            priority: data.priority || 'MEDIUM',
            category: data.category,
            status: data.status || 'ON_TRACK',
            progress_notes: data.progress_notes || null,
          }])
          .select().single()
        if (error) throw error
        result = row
        break
      }
      case 'flag': {
        const { error, data: row } = await supabase
          .from('behavioral_flags')
          .insert([{
            client_id: data.client_id,
            date: data.date || new Date().toISOString(),
            market_context: data.market_context,
            client_behavior: data.client_behavior,
            advisor_response: data.advisor_response || null,
            severity: data.severity || 'MEDIUM',
            is_internal: data.is_internal ?? true,
            resolved: false,
          }])
          .select().single()
        if (error) throw error
        result = row
        break
      }
      case 'decision': {
        const { error, data: row } = await supabase
          .from('decision_log')
          .insert([{
            client_id: data.client_id,
            date: data.date || new Date().toISOString(),
            decision: data.decision,
            context: data.context,
            emotional_state: data.emotional_state || null,
            reasoning: data.reasoning || null,
            advisor_note: data.advisor_note || null,
            outcome: data.outcome || null,
            is_internal: data.is_internal ?? false,
          }])
          .select().single()
        if (error) throw error
        result = row
        break
      }
      case 'communication': {
        const { error, data: row } = await supabase
          .from('communications')
          .insert([{
            client_id: data.client_id,
            date: data.date || new Date().toISOString(),
            type: data.comm_type,
            summary: data.summary,
            is_internal: data.is_internal ?? false,
          }])
          .select().single()
        if (error) throw error
        result = row
        break
      }
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Create record error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
