import { createServiceClient } from '@/lib/supabase/server'
import { getGoalsByClientId } from './goals'
import { getFlagsByClientId } from './flags'
import { getReviewsByClientId } from './reviews'
import type { PostgrestError } from '@supabase/supabase-js'

type QueryResult<T> = { data: T[] | null; error: PostgrestError | null }

function handleResult<T>({ data, error }: QueryResult<T>, label: string): T[] {
  if (error) {
    console.error(`Error fetching ${label}:`, error)
    return []
  }
  return data || []
}

export async function getClientWithAllData(clientId: string) {
  const supabase = createServiceClient()
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
      .then((result: QueryResult<unknown>) => handleResult(result, 'decisions')),
    getReviewsByClientId(clientId),
    supabase
      .from('communications')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .then((result: QueryResult<unknown>) => handleResult(result, 'communications')),
    supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })
      .then((result: QueryResult<unknown>) => handleResult(result, 'documents')),
    supabase
      .from('behavioral_snapshots')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
      .then((result: QueryResult<unknown>) => handleResult(result, 'snapshots')),
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