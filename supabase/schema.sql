-- ============================================================
-- SCHEMA: Dashboard de Agentes IA
-- Rode este SQL no Supabase SQL Editor
-- ============================================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agentes IA por cliente
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  n8n_workflow_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela principal: conversas/atendimentos
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,

  -- Identificação do lead
  lead_phone TEXT,
  lead_name TEXT,

  -- Timestamps de lifecycle
  started_at TIMESTAMPTZ DEFAULT NOW(),         -- início da conversa
  first_response_at TIMESTAMPTZ,                -- 1ª resposta do agente IA
  qualified_at TIMESTAMPTZ,                     -- lead qualificado
  handoff_requested_at TIMESTAMPTZ,             -- IA pediu para atendente assumir
  attendant_joined_at TIMESTAMPTZ,              -- atendente humano assumiu
  closed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'open'
    CHECK (status IN ('open', 'attending', 'qualified', 'follow_up', 'transferred', 'closed')),

  -- Flags
  is_qualified BOOLEAN DEFAULT FALSE,
  is_follow_up BOOLEAN DEFAULT FALSE,

  -- Metadados extras vindos do n8n
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);

-- Habilitar Realtime (rode no Supabase Dashboard > Database > Replication)
-- ALTER TABLE conversations REPLICA IDENTITY FULL;

-- ============================================================
-- DADOS DE EXEMPLO (opcional para testar o dashboard)
-- ============================================================

INSERT INTO clients (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Empresa Alpha', 'alpha'),
  ('22222222-2222-2222-2222-222222222222', 'Empresa Beta', 'beta'),
  ('33333333-3333-3333-3333-333333333333', 'Empresa Gamma', 'gamma')
ON CONFLICT DO NOTHING;

INSERT INTO agents (id, client_id, name, n8n_workflow_id) VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Agente Vendas Alpha', 'wf-001'),
  ('aaaa1111-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Agente Suporte Beta', 'wf-002'),
  ('aaaa1111-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'Agente Qualif. Gamma', 'wf-003')
ON CONFLICT DO NOTHING;

-- Inserir conversas de exemplo (últimas 24h)
INSERT INTO conversations (client_id, agent_id, lead_phone, lead_name, started_at, first_response_at, qualified_at, handoff_requested_at, attendant_joined_at, status, is_qualified, is_follow_up)
SELECT
  CASE (i % 3)
    WHEN 0 THEN '11111111-1111-1111-1111-111111111111'::UUID
    WHEN 1 THEN '22222222-2222-2222-2222-222222222222'::UUID
    ELSE '33333333-3333-3333-3333-333333333333'::UUID
  END,
  CASE (i % 3)
    WHEN 0 THEN 'aaaa1111-0000-0000-0000-000000000001'::UUID
    WHEN 1 THEN 'aaaa1111-0000-0000-0000-000000000002'::UUID
    ELSE 'aaaa1111-0000-0000-0000-000000000003'::UUID
  END,
  '+5511' || (900000000 + i)::TEXT,
  'Lead ' || i,
  NOW() - (random() * INTERVAL '24 hours'),
  NOW() - (random() * INTERVAL '23 hours') + INTERVAL '30 seconds',
  CASE WHEN i % 3 = 0 THEN NOW() - (random() * INTERVAL '20 hours') ELSE NULL END,
  CASE WHEN i % 4 = 0 THEN NOW() - (random() * INTERVAL '15 hours') ELSE NULL END,
  CASE WHEN i % 4 = 0 THEN NOW() - (random() * INTERVAL '14 hours') ELSE NULL END,
  CASE (i % 5)
    WHEN 0 THEN 'qualified'
    WHEN 1 THEN 'follow_up'
    WHEN 2 THEN 'transferred'
    WHEN 3 THEN 'closed'
    ELSE 'open'
  END,
  (i % 3 = 0),
  (i % 5 = 1)
FROM generate_series(1, 120) AS i;
