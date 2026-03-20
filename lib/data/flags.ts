import { getServerSupabase } from '@/lib/supabase/server'

export async function getFlagsByClientId(clientId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('*')
    .eq('client_id', clientId)
    .order('detected_at', { ascending: false })

  if (error) {
    console.error('Error fetching flags:', error)
    return []
  }

  return data || []
}

export async function getAllActiveFlags() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select(`
      *,
      client:clients(
        id,
        user:users!clients_user_id_fkey(name, email)
      )
    `)
    .eq('status', 'ACTIVE')
    .order('detected_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createFlag(flagData: {
  client_id: string
  flag_type: string
  severity: string
  description?: string
  status: string
  detected_at?: string
}) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .insert([{
      ...flagData,
      detected_at: flagData.detected_at || new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFlag(flagId: string, updates: any) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .update(updates)
    .eq('id', flagId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function resolveFlag(flagId: string, resolution: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .update({
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      resolution,
    })
    .eq('id', flagId)
    .select()
    .single()

  if (error) throw error
  return data
}
