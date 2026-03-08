export type ConversationStatus =
  | 'open'
  | 'attending'
  | 'qualified'
  | 'follow_up'
  | 'transferred'
  | 'closed'

export interface Client {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Agent {
  id: string
  client_id: string
  name: string
  n8n_workflow_id: string | null
  created_at: string
}

export interface Conversation {
  id: string
  client_id: string
  agent_id: string | null
  lead_phone: string | null
  lead_name: string | null
  started_at: string
  first_response_at: string | null
  qualified_at: string | null
  handoff_requested_at: string | null
  attendant_joined_at: string | null
  closed_at: string | null
  status: ConversationStatus
  is_qualified: boolean
  is_follow_up: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // joins
  clients?: Client
  agents?: Agent
}

export interface DashboardMetrics {
  totalLeads: number
  qualifiedLeads: number
  followUpLeads: number
  transferredLeads: number
  avgResponseTimeSeconds: number
  avgWaitTimeSeconds: number
  openConversations: number
  conversionRate: number
}

export interface ChartDataPoint {
  hour: string
  leads: number
  qualified: number
  followUp: number
}

export interface ClientUser {
  id: string
  user_id: string
  client_id: string
  role: 'admin' | 'viewer'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Omit<Client, 'id' | 'created_at'>; Update: Partial<Client> }
      agents: { Row: Agent; Insert: Omit<Agent, 'id' | 'created_at'>; Update: Partial<Agent> }
      conversations: { Row: Conversation; Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Conversation> }
      client_users: { Row: ClientUser; Insert: Omit<ClientUser, 'id' | 'created_at'>; Update: Partial<ClientUser> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
