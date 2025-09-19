// 組織別設定管理
export interface OrganizationConfig {
  id: string
  name: string
  displayName: string
  domain?: string
  features: {
    aiTaskGeneration: boolean
    emailNotifications: boolean
    calendarSync: boolean
    subsidyManagement: boolean
    adminDashboard: boolean
    scheduleOptimization: boolean
  }
  limits: {
    maxUsers: number
    maxProjects: number
    maxTasksPerMonth: number
    dataRetentionDays: number
  }
  branding?: {
    primaryColor?: string
    logoUrl?: string
    customCss?: string
  }
}

// デフォルト設定
export const DEFAULT_ORG_CONFIG: OrganizationConfig = {
  id: 'default',
  name: 'default-org',
  displayName: '社労士事務所',
  features: {
    aiTaskGeneration: true,
    emailNotifications: true,
    calendarSync: true,
    subsidyManagement: true,
    adminDashboard: true,
    scheduleOptimization: true
  },
  limits: {
    maxUsers: 10,
    maxProjects: 100,
    maxTasksPerMonth: 1000,
    dataRetentionDays: 365
  }
}

// 組織設定を環境変数から読み込み
export function getOrganizationConfig(): OrganizationConfig {
  // 環境変数から組織固有の設定を読み込む
  const orgName = process.env.ORGANIZATION_NAME || 'default-org'
  const displayName = process.env.ORGANIZATION_DISPLAY_NAME || '社労士事務所'
  
  return {
    id: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: orgName,
    displayName: displayName,
    domain: process.env.ORGANIZATION_DOMAIN,
    features: {
      aiTaskGeneration: process.env.ENABLE_AI !== 'false',
      emailNotifications: process.env.ENABLE_EMAIL !== 'false',
      calendarSync: process.env.ENABLE_CALENDAR !== 'false',
      subsidyManagement: process.env.ENABLE_SUBSIDY !== 'false',
      adminDashboard: process.env.ENABLE_ADMIN !== 'false',
      scheduleOptimization: process.env.ENABLE_SCHEDULE !== 'false'
    },
    limits: {
      maxUsers: parseInt(process.env.MAX_USERS || '10'),
      maxProjects: parseInt(process.env.MAX_PROJECTS || '100'),
      maxTasksPerMonth: parseInt(process.env.MAX_TASKS_PER_MONTH || '1000'),
      dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365')
    },
    branding: {
      primaryColor: process.env.BRAND_COLOR,
      logoUrl: process.env.LOGO_URL,
      customCss: process.env.CUSTOM_CSS
    }
  }
}