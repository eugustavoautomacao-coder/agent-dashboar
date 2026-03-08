-- ============================================================
-- AUTH + RLS: Rode este SQL no Supabase SQL Editor
-- APÓS já ter rodado o schema.sql
-- ============================================================

-- Tabela que vincula usuários Supabase Auth aos clientes
CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- Índice para lookup rápido
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON client_users(user_id);

-- ============================================================
-- RLS: Habilitar em todas as tabelas
-- ============================================================

ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: clients
-- ============================================================

-- Usuário vê apenas os clientes aos quais está vinculado
CREATE POLICY "clients: usuario ve seu cliente"
  ON clients FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: agents
-- ============================================================

CREATE POLICY "agents: usuario ve agentes do seu cliente"
  ON agents FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: conversations
-- ============================================================

CREATE POLICY "conversations: usuario ve conversas do seu cliente"
  ON conversations FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- POLICIES: client_users
-- ============================================================

-- Usuário vê apenas seus próprios vínculos
CREATE POLICY "client_users: usuario ve seus vinculos"
  ON client_users FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- SERVICE ROLE: n8n usa a service_role key para gravar
-- (service_role bypassa RLS automaticamente)
-- ============================================================

-- ============================================================
-- COMO CRIAR USUÁRIOS PARA CADA CLIENTE
-- ============================================================
-- 1. Crie o usuário no Supabase Dashboard > Authentication > Users
--    ou via API com service_role
--
-- 2. Após criar, vincule ao cliente:
--
-- INSERT INTO client_users (user_id, client_id)
-- VALUES (
--   'UUID-DO-USUARIO-CRIADO',   -- auth.users.id
--   '11111111-1111-1111-1111-111111111111'  -- clients.id
-- );
--
-- Exemplo com lookup por email:
-- INSERT INTO client_users (user_id, client_id)
-- SELECT u.id, '11111111-1111-1111-1111-111111111111'
-- FROM auth.users u
-- WHERE u.email = 'contato@empresa-alpha.com.br';
-- ============================================================
