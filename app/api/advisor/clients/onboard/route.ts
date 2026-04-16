import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // Check email not already taken in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some(u => u.email === body.email)
    if (emailTaken) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Create the auth user — trigger auto-creates the public.users row
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: 'client123',
      email_confirm: true,           // skip confirmation email for advisor-created accounts
      user_metadata: {
        role: 'CLIENT',
        name: body.name,
      },
    })

    if (authError) throw authError

    const newUserId = authData.user.id

    // Get advisor id from the request body (set by the client from supabase session)
    const advisorId = body.advisorId || null

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: newUserId,
        advisor_id: advisorId,
        phone: body.phone || null,
        date_of_birth: body.dateOfBirth || null,
        occupation: body.occupation || null,
        city: body.city || null,
        marital_status: body.maritalStatus || null,
        dependents: body.dependents || 0,
        family_notes: body.familyNotes || null,
        income_range: body.incomeRange || null,
        net_worth_band: body.netWorthBand || null,
        primary_liability: body.primaryLiability || null,
        stated_risk_score: body.statedRiskScore || 5,
        revealed_risk_score: body.statedRiskScore || 5,
        discomfort_budget: body.discomfortBudget || 10,
        panic_threshold: body.panicThreshold || -5,
        decision_temperament: body.decisionTemperament || 'BALANCED',
        behavioral_summary: body.behavioralSummary || null,
        status: 'ACTIVE',
        onboarded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (clientError) throw clientError

    return NextResponse.json({
      success: true,
      clientId: newClient.id,
      credentials: {
        email: body.email,
        password: 'client123',
      },
    })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    )
  }
}
