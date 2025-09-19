export interface CloudflareBindings {
  DB: D1Database
  KV: KVNamespace
  ENVIRONMENT: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  GEMINI_API_KEY: string
  SENDGRID_API_KEY: string
  APP_URL: string
  REDIRECT_URI: string
}

export interface User {
  sub: string
  email: string
  name: string
  role: string
  organizationId: number
}

export interface Task {
  id?: string
  title: string
  description?: string
  project_id?: string
  assignee_id?: string
  status?: string
  priority?: string
  due_date?: string
  estimatedHours?: number
  dependencies?: string[]
  scheduled_start?: Date
  scheduled_end?: Date
  is_critical?: boolean
  buffer_days?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  status: string
  organization_id: number
}