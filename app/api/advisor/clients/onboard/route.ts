import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServiceClient()

    // Check email not already taken in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const emailTaken = existingUsers?.users?.some((u: { email?: string }) => u.email === body.email)
    if (emailTaken) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Use the configured password, falling back to default
    const password = body.initialPassword?.trim() || 'client123'

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'CLIENT',
        name: body.name,
      },
    })

    if (authError) throw authError

    const newUserId = authData.user.id

    // Advisor is whoever creates the account (passed from client session)
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
        password,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create client'
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
