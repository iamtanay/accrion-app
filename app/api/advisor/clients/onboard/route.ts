import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()

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

    let userId: string

    if (body.createCredentials) {
      const defaultPassword = 'client123'
      const passwordHash = await bcrypt.hash(defaultPassword, 10)

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: body.email,
          name: body.name,
          password_hash: passwordHash,
          role: 'CLIENT'
        })
        .select()
        .single()

      if (userError) throw userError
      userId = newUser.id
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: body.email,
          name: body.name,
          role: 'CLIENT'
        })
        .select()
        .single()

      if (userError) throw userError
      userId = newUser.id
    }

    const advisorUser = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADVISOR')
      .maybeSingle()

    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        advisor_id: advisorUser.data?.id || null,
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
        onboarded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (clientError) throw clientError

    return NextResponse.json({
      success: true,
      clientId: newClient.id,
      message: body.createCredentials
        ? 'Client onboarded successfully. Default password: client123'
        : 'Client onboarded successfully'
    })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to onboard client' },
      { status: 500 }
    )
  }
}
