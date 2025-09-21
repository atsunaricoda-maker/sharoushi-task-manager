export type Bindings = {
  DB: D1Database
  KV: KVNamespace
  JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ENVIRONMENT: string
}

export type User = {
  id: number
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  created_at: string
  last_login?: string
  avatar_url?: string
}

export type Client = {
  id: number
  name: string
  company_name?: string
  email?: string
  phone?: string
  address?: string
  contract_plan?: string
  employee_count?: number
  monthly_fee?: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Task = {
  id: number
  client_id?: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to?: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export type Project = {
  id: number
  client_id?: number
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  budget?: number
  created_at: string
  updated_at: string
}

export type SubsidyApplication = {
  id: number
  client_id: number
  subsidy_name: string
  application_date?: string
  deadline_date?: string
  amount_requested?: number
  amount_approved?: number
  status: 'preparing' | 'submitted' | 'approved' | 'rejected' | 'withdrawn'
  approval_date?: string
  notes?: string
  documents?: string
  created_at: string
  updated_at: string
}

export type ScheduleEntry = {
  id: number
  user_id: number
  client_id?: number
  title: string
  description?: string
  entry_type: 'meeting' | 'task' | 'deadline' | 'reminder' | 'other'
  start_time: string
  end_time?: string
  location?: string
  is_recurring: boolean
  recurrence_pattern?: string
  created_at: string
  updated_at: string
}