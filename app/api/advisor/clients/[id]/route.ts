import { NextRequest, NextResponse } from 'next/server'
import { getClientWithAllData } from '@/lib/data/client-detail'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const data = await getClientWithAllData(clientId)

    if (!data.client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching client data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch client data' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const updates = await request.json()
    const supabase = createServiceClient()

    const { name, email, ...clientUpdates } = updates

    if (name || email) {
      const { data: client } = await supabase
        .from('clients')
        .select('user_id')
        .eq('id', clientId)
        .maybeSingle()

      if (client?.user_id) {
        // Update auth.users — the update trigger syncs public.users automatically
        const authUpdates: any = {}
        if (email) authUpdates.email = email
        if (name) authUpdates.user_metadata = { name }

        const { error: userError } = await supabase.auth.admin.updateUserById(
          client.user_id,
          authUpdates
        )

        if (userError) throw userError
      }
    }

    const { error: clientError } = await supabase
      .from('clients')
      .update(clientUpdates)
      .eq('id', clientId)

    if (clientError) throw clientError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update client' },
      { status: 500 }
    )
  }
}
