import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase-admin'
import { cookies } from 'next/headers'

async function isSuperAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(toSet) {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return !!data
}

// GET /api/super-admin/clients — lista todos os clientes com seus usuários
export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: clients, error } = await admin
    .from('clients')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Buscar vínculos de usuários para cada cliente
  const { data: clientUsers } = await admin
    .from('client_users')
    .select('client_id, user_id, role')

  // Buscar emails dos usuários via auth.admin
  const { data: authUsers } = await admin.auth.admin.listUsers()

  const userMap = new Map(authUsers?.users?.map((u) => [u.id, u.email]) ?? [])

  const clientsWithUsers = clients?.map((c) => ({
    ...c,
    users: (clientUsers ?? [])
      .filter((cu) => cu.client_id === c.id)
      .map((cu) => ({ userId: cu.user_id, email: userMap.get(cu.user_id) ?? '—', role: cu.role })),
  }))

  return NextResponse.json({ clients: clientsWithUsers })
}
