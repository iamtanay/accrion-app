import { getServerSupabase } from '@/lib/supabase/server'
import { getGoalsByClientId } from './goals'
import { getFlagsByClientId } from './flags'
import { getReviewsByClientId } from './reviews'

export async function getClientWithAllData(clientId: string) {
  const supabase = getServerSupabase()
  const [client, goals, flags, decisions, reviews, communications, documents, snapshots] = await Promise.all([
    supabase
      .from('clients')
      .select('*, user:users!clients_user_id_fkey(*)')
      .eq('id', clientId)
      .maybeSingle(),
    getGoalsByClientId(clientId),
    getFlagsByClientId(clientId),
    supabase
      .from('decision_log')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching decisions:', error)
          return []
        }
        return data || []
      }),
    getReviewsByClientId(clientId),
    supabase
      .from('communications')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching communications:', error)
          return []
        }
        return data || []
      }),
    supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching documents:', error)
          return []
        }
        return data || []
      }),
    supabase
      .from('behavioral_snapshots')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching snapshots:', error)
          return []
        }
        return data || []
      }),
  ])

  if (client.error) {
    console.error('Error fetching client:', client.error)
    throw client.error
  }

  const clientData = client.data

  return {
    client: clientData,
    goals,
    flags,
    decisions,
    reviews,
    communications,
    documents,
    snapshots,
  }
}
