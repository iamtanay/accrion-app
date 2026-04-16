import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { FlagsClient } from '@/components/advisor/FlagsClient'

export const dynamic = 'force-dynamic'

async function getAllFlags() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('behavioral_flags')
    .select('*, client:clients(id, user:users!clients_user_id_fkey(name, email))')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching flags:', error)
    return []
  }
  return data || []
}

export default async function FlagsPage() {
  const flags = await getAllFlags()
  return <FlagsClient initialFlags={flags} />
}
