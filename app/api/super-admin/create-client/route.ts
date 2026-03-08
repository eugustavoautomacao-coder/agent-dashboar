import { NextRequest, NextResponse } from 'next/server'
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

// POST /api/super-admin/create-client
// Body: { clientName, clientSlug, userEmail, userPassword, userRole }
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json()
  const { clientName, clientSlug, userEmail, userPassword, userRole = 'viewer' } = body

  if (!clientName || !clientSlug) {
    return NextResponse.json({ error: 'clientName e clientSlug são obrigatórios' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Criar o client
  const { data: client, error: clientError } = await admin
    .from('clients')
    .insert({ name: clientName, slug: clientSlug })
    .select()
    .single()

  if (clientError) {
    return NextResponse.json({ error: `Erro ao criar cliente: ${clientError.message}` }, { status: 500 })
  }

  // 2. Se email/senha fornecidos, criar usuário Auth e vincular
  if (userEmail && userPassword) {
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    })

    if (authError) {
      // Rollback: deletar cliente criado
      await admin.from('clients').delete().eq('id', client.id)
      return NextResponse.json({ error: `Erro ao criar usuário: ${authError.message}` }, { status: 500 })
    }

    const { error: linkError } = await admin
      .from('client_users')
      .insert({ user_id: authUser.user.id, client_id: client.id, role: userRole })

    if (linkError) {
      return NextResponse.json({ error: `Cliente criado, mas erro ao vincular usuário: ${linkError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, client, userId: authUser.user.id })
  }

  return NextResponse.json({ success: true, client })
}
