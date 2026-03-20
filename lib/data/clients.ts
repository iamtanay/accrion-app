import { getServerSupabase } from '@/lib/supabase/server'
import type { ClientProfile, ClientWithUser } from '@/lib/types'

export async function getAllClients(): Promise<ClientWithUser[]> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*, user:users!clients_user_id_fkey(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all clients:', error)
    return []
  }

  return (data || []) as unknown as ClientWithUser[]
}

export async function getClientById(id: string): Promise<ClientWithUser | null> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*, user:users!clients_user_id_fkey(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching client by id:', error)
    return null
  }

  return data as unknown as ClientWithUser
}

export async function getActiveClients(): Promise<ClientWithUser[]> {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('*, user:users!clients_user_id_fkey(*)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching active clients:', error)
    return []
  }

  return (data || []) as unknown as ClientWithUser[]
}

export async function getClientsCount(): Promise<number> {
  const supabase = getServerSupabase()
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVE')

  if (error) throw error
  return count || 0
}
