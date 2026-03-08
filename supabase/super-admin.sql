-- ============================================================
-- SUPER ADMIN: Rode este SQL no Supabase SQL Editor
-- APÓS já ter rodado o schema.sql e auth-rls.sql
-- ============================================================

-- Tabela de super admins (acesso total ao sistema)
CREATE TABLE IF NOT EXISTS super_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS na tabela super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver seus próprios registros
CREATE POLICY "super_admins: usuario ve seu proprio registro"
  ON super_admins FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- POLICIES ADICIONAIS: Super admin vê TUDO
-- ============================================================

-- Dropar policies existentes e recriar com acesso super_admin

-- clients: super_admin vê todos
DROP POLICY IF EXISTS "clients: usuario ve seu cliente" ON clients;
CREATE POLICY "clients: usuario ve seu cliente"
  ON clients FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Super admin pode criar/editar/deletar clientes
CREATE POLICY "clients: super_admin pode inserir"
  ON clients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "clients: super_admin pode atualizar"
  ON clients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

CREATE POLICY "clients: super_admin pode deletar"
  ON clients FOR DELETE
  USING (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- agents: super_admin vê todos
DROP POLICY IF EXISTS "agents: usuario ve agentes do seu cliente" ON agents;
CREATE POLICY "agents: usuario ve agentes do seu cliente"
  ON agents FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- conversations: super_admin vê todas
DROP POLICY IF EXISTS "conversations: usuario ve conversas do seu cliente" ON conversations;
CREATE POLICY "conversations: usuario ve conversas do seu cliente"
  ON conversations FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- client_users: super_admin vê todos os vínculos
DROP POLICY IF EXISTS "client_users: usuario ve seus vinculos" ON client_users;
CREATE POLICY "client_users: usuario ve seus vinculos"
  ON client_users FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Super admin pode inserir vínculos
CREATE POLICY "client_users: super_admin pode inserir"
  ON client_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid()));

-- ============================================================
-- REGISTRAR O SUPER ADMIN: gustavo.oliveira@airys.com.br
-- Execute APÓS criar o usuário no Supabase Auth:
-- ============================================================
-- 1. Crie o usuário em: Authentication > Users > Add User
--    Email: gustavo.oliveira@airys.com.br
--    Password: Mudar@123
--
-- 2. Após criar, rode o INSERT abaixo trocando pelo UUID real:
--
-- INSERT INTO super_admins (user_id)
-- SELECT id FROM auth.users WHERE email = 'gustavo.oliveira@airys.com.br';
-- ============================================================
