import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check email not already taken
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password — default is 'client123'
    const passwordHash = await bcrypt.hash('client123', 10)

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: body.email,
        name: body.name,
        password_hash: passwordHash,
        role: 'CLIENT',
      })
      .select()
      .single()

    if (userError) throw userError

    // Get the advisor who is creating this client (passed from the session)
    const advisorId = body.advisorId || null

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: newUser.id,
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
