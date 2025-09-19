/**
 * AI Project & Task Generator
 * プロンプトからプロジェクトとタスクリストを自動生成
 */

import { GeminiService } from './gemini'
import { TaskScheduler, SchedulingOptions, SchedulingResult } from './task-scheduler'

interface GeneratedProject {
  name: string
  description: string
  objectives: string[]
  estimatedDuration: number // 日数
  priority: 'low' | 'medium' | 'high' | 'critical'
  milestones: Array<{
    name: string
    description: string
    daysFromStart: number
  }>
}

interface GeneratedTask {
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high'
  estimatedHours: number
  dependencies: string[] // 他のタスクのタイトル
  assigneeRole?: string // 担当者の役割（例：経理担当、人事担当）
  daysFromStart: number // プロジェクト開始からの日数
  milestone?: string // 関連するマイルストーン
}

interface ProjectGenerationResult {
  project: GeneratedProject
  tasks: GeneratedTask[]
  phases: Array<{
    name: string
    description: string
    tasks: GeneratedTask[]
  }>
}

export class AIProjectGenerator {
  private geminiService: GeminiService
  private taskScheduler: TaskScheduler

  constructor(apiKey: string) {
    this.geminiService = new GeminiService(apiKey)
    this.taskScheduler = new TaskScheduler()
  }

  /**
   * プロンプトからプロジェクトとタスクを生成
   */
  async generateProjectFromPrompt(
    prompt: string,
    context?: {
      clientName?: string
      clientType?: string
      teamSize?: number
      deadline?: string
    }
  ): Promise<ProjectGenerationResult> {
    const systemPrompt = `
あなたは日本の労務管理の専門家です。
与えられたプロンプトから、詳細なプロジェクト計画とタスクリストを生成してください。

コンテキスト情報：
- クライアント名: ${context?.clientName || '未指定'}
- クライアント業種: ${context?.clientType || '未指定'}
- チーム規模: ${context?.teamSize || 7}人
- 期限: ${context?.deadline || '未指定'}

以下のJSON形式で回答してください：
{
  "project": {
    "name": "プロジェクト名",
    "description": "詳細な説明",
    "objectives": ["目的1", "目的2"],
    "estimatedDuration": 30,
    "priority": "high",
    "milestones": [
      {
        "name": "マイルストーン名",
        "description": "説明",
        "daysFromStart": 7
      }
    ]
  },
  "tasks": [
    {
      "title": "タスク名",
      "description": "詳細説明",
      "category": "カテゴリ",
      "priority": "high",
      "estimatedHours": 2,
      "dependencies": [],
      "assigneeRole": "担当者の役割",
      "daysFromStart": 0,
      "milestone": "関連マイルストーン名"
    }
  ],
  "phases": [
    {
      "name": "フェーズ名",
      "description": "説明",
      "tasks": [タスクリスト]
    }
  ]
}

タスクは具体的で実行可能なものにしてください。
労務管理の実務に即した内容にしてください。`

    const fullPrompt = `
ユーザーのリクエスト：
${prompt}

上記のリクエストに基づいて、労務管理プロジェクトの詳細計画を生成してください。
    `

    try {
      const response = await this.geminiService.generateContent(fullPrompt, systemPrompt)
      
      // JSONを抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response as JSON')
      }

      const result = JSON.parse(jsonMatch[0]) as ProjectGenerationResult

      // バリデーションと正規化
      return this.validateAndNormalizeResult(result)
    } catch (error) {
      console.error('Failed to generate project:', error)
      // フォールバックとして基本的なプロジェクトを生成
      return this.generateFallbackProject(prompt)
    }
  }

  /**
   * 特定の業務カテゴリ用のプロジェクト生成
   */
  async generateCategoryProject(
    category: 'payroll' | 'insurance' | 'labor' | 'hr' | 'compliance',
    clientInfo: {
      name: string
      employeeCount: number
      industry: string
    }
  ): Promise<ProjectGenerationResult> {
    const categoryPrompts: Record<string, string> = {
      payroll: `${clientInfo.name}（従業員${clientInfo.employeeCount}名、${clientInfo.industry}）の給与計算業務の月次プロジェクトを作成してください。給与計算、勤怠集計、社会保険料計算、源泉徴収、給与明細発行などを含めてください。`,
      insurance: `${clientInfo.name}の社会保険手続きプロジェクトを作成してください。資格取得・喪失、算定基礎届、月額変更届、育児休業関連手続きなどを含めてください。`,
      labor: `${clientInfo.name}の労働保険年度更新プロジェクトを作成してください。労働保険料の計算、申告書作成、納付手続きなどを含めてください。`,
      hr: `${clientInfo.name}の人事制度構築プロジェクトを作成してください。就業規則の作成・改定、人事評価制度、賃金制度の設計などを含めてください。`,
      compliance: `${clientInfo.name}のコンプライアンス監査プロジェクトを作成してください。労働基準法遵守状況、安全衛生管理、個人情報保護などの確認を含めてください。`
    }

    return await this.generateProjectFromPrompt(
      categoryPrompts[category],
      {
        clientName: clientInfo.name,
        clientType: clientInfo.industry,
        teamSize: 7
      }
    )
  }

  /**
   * 季節業務の自動生成
   */
  async generateSeasonalTasks(month: number): Promise<GeneratedTask[]> {
    const seasonalTasks: Record<number, string[]> = {
      1: ['年末調整の還付処理', '法定調書の作成・提出', '給与支払報告書の提出'],
      3: ['36協定の更新確認', '新年度の労働条件通知書準備'],
      4: ['新入社員の社会保険手続き', '労働保険の年度更新準備'],
      5: ['労働保険の年度更新手続き', '住民税の特別徴収切替'],
      6: ['賞与計算準備', '算定基礎届の準備'],
      7: ['算定基礎届の提出', '夏季賞与の計算・支払'],
      10: ['年末調整の準備開始', '最低賃金の改定確認'],
      11: ['年末調整書類の配布・回収'],
      12: ['年末調整計算', '賞与計算', '源泉徴収票の作成']
    }

    const tasksForMonth = seasonalTasks[month] || []
    
    return tasksForMonth.map((taskTitle, index) => ({
      title: taskTitle,
      description: `${month}月の定例業務: ${taskTitle}`,
      category: 'seasonal',
      priority: 'high' as const,
      estimatedHours: 4,
      dependencies: [],
      daysFromStart: index * 2,
      assigneeRole: '労務担当'
    }))
  }

  /**
   * タスクの依存関係を解析して最適な順序を決定
   */
  optimizeTaskOrder(tasks: GeneratedTask[]): GeneratedTask[] {
    const taskMap = new Map<string, GeneratedTask>()
    const visited = new Set<string>()
    const result: GeneratedTask[] = []

    // タスクマップを作成
    tasks.forEach(task => taskMap.set(task.title, task))

    // トポロジカルソート
    const visit = (taskTitle: string) => {
      if (visited.has(taskTitle)) return
      visited.add(taskTitle)

      const task = taskMap.get(taskTitle)
      if (!task) return

      // 依存タスクを先に処理
      task.dependencies.forEach(dep => visit(dep))
      
      result.push(task)
    }

    // 全タスクを処理
    tasks.forEach(task => visit(task.title))

    return result
  }

  /**
   * 結果の検証と正規化
   */
  private validateAndNormalizeResult(result: any): ProjectGenerationResult {
    // プロジェクトの検証
    const project: GeneratedProject = {
      name: result.project?.name || '新規プロジェクト',
      description: result.project?.description || '',
      objectives: Array.isArray(result.project?.objectives) ? result.project.objectives : [],
      estimatedDuration: result.project?.estimatedDuration || 30,
      priority: this.validatePriority(result.project?.priority) as any,
      milestones: Array.isArray(result.project?.milestones) ? result.project.milestones : []
    }

    // タスクの検証
    const tasks: GeneratedTask[] = Array.isArray(result.tasks) 
      ? result.tasks.map(task => ({
          title: task.title || 'タスク',
          description: task.description || '',
          category: task.category || 'general',
          priority: this.validatePriority(task.priority) as any,
          estimatedHours: task.estimatedHours || 2,
          dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
          assigneeRole: task.assigneeRole,
          daysFromStart: task.daysFromStart || 0,
          milestone: task.milestone
        }))
      : []

    // フェーズの検証
    const phases = Array.isArray(result.phases) ? result.phases : []

    return { project, tasks, phases }
  }

  /**
   * 優先度の検証
   */
  private validatePriority(priority: any): string {
    const validPriorities = ['low', 'medium', 'high', 'critical']
    return validPriorities.includes(priority) ? priority : 'medium'
  }

  /**
   * フォールバックプロジェクトの生成
   */
  private generateFallbackProject(prompt: string): ProjectGenerationResult {
    return {
      project: {
        name: '労務管理プロジェクト',
        description: prompt,
        objectives: ['業務の効率化', 'コンプライアンスの確保'],
        estimatedDuration: 30,
        priority: 'medium',
        milestones: [
          {
            name: '初期設定完了',
            description: '基本情報の設定と確認',
            daysFromStart: 7
          },
          {
            name: '実行フェーズ完了',
            description: 'メインタスクの完了',
            daysFromStart: 21
          }
        ]
      },
      tasks: [
        {
          title: '要件確認',
          description: 'プロジェクトの要件と範囲を確認',
          category: 'planning',
          priority: 'high',
          estimatedHours: 2,
          dependencies: [],
          daysFromStart: 0,
          assigneeRole: 'プロジェクトマネージャー'
        },
        {
          title: '計画策定',
          description: '詳細な実行計画の策定',
          category: 'planning',
          priority: 'high',
          estimatedHours: 4,
          dependencies: ['要件確認'],
          daysFromStart: 1,
          assigneeRole: 'プロジェクトマネージャー'
        },
        {
          title: '実行',
          description: 'メインタスクの実行',
          category: 'execution',
          priority: 'medium',
          estimatedHours: 8,
          dependencies: ['計画策定'],
          daysFromStart: 3,
          assigneeRole: '担当者'
        },
        {
          title: '確認・レビュー',
          description: '成果物の確認とレビュー',
          category: 'review',
          priority: 'medium',
          estimatedHours: 2,
          dependencies: ['実行'],
          daysFromStart: 7,
          assigneeRole: 'レビュアー'
        }
      ],
      phases: [
        {
          name: '計画フェーズ',
          description: 'プロジェクトの計画と準備',
          tasks: []
        },
        {
          name: '実行フェーズ',
          description: 'タスクの実行',
          tasks: []
        },
        {
          name: '完了フェーズ',
          description: 'レビューと完了処理',
          tasks: []
        }
      ]
    }
  }
}

/**
 * プロジェクトの進捗計算
 */
export class ProjectProgressCalculator {
  /**
   * プロジェクト全体の進捗を計算
   */
  static calculateProjectProgress(tasks: Array<{
    status: string
    progress?: number
    estimated_hours?: number
  }>): {
    overallProgress: number
    completedTasks: number
    totalTasks: number
    completedHours: number
    totalHours: number
  } {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
    const completedHours = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
    
    const progressByCount = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const progressByHours = totalHours > 0 ? (completedHours / totalHours) * 100 : 0
    
    // 重み付き平均（タスク数40%、時間60%）
    const overallProgress = Math.round(progressByCount * 0.4 + progressByHours * 0.6)
    
    return {
      overallProgress,
      completedTasks,
      totalTasks,
      completedHours,
      totalHours
    }
  }

  /**
   * マイルストーンの進捗を計算
   */
  static calculateMilestoneProgress(
    milestone: { due_date: string },
    tasks: Array<{ status: string }>
  ): {
    progress: number
    isDelayed: boolean
    daysRemaining: number
  } {
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0
    
    const dueDate = new Date(milestone.due_date)
    const today = new Date()
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    const isDelayed = daysRemaining < 0 && progress < 100
    
    return {
      progress: Math.round(progress),
      isDelayed,
      daysRemaining
    }
  }

  /**
   * プロジェクトの期限に基づいてタスクスケジュールを自動調整
   */
  async generateOptimizedSchedule(
    tasks: GeneratedTask[],
    projectStartDate: Date,
    projectEndDate: Date,
    options?: Partial<SchedulingOptions>
  ): Promise<SchedulingResult> {
    // デフォルトオプション
    const schedulingOptions: SchedulingOptions = {
      projectStartDate,
      projectEndDate,
      workingHoursPerDay: 8,
      bufferRatio: 0.2,
      excludeWeekends: true,
      excludeHolidays: true,
      parallelTaskLimit: 3,
      tightScheduleThreshold: 0.8,
      ...options
    }

    // タスクにIDを付与
    const tasksWithIds = tasks.map((task, index) => ({
      ...task,
      id: `task_${index + 1}`
    }))

    // スケジュールを生成
    const result = this.taskScheduler.generateSchedule(
      tasksWithIds,
      schedulingOptions
    )

    // 警告がある場合はAIで改善案を生成
    if (result.warnings.filter(w => w.severity === 'critical').length > 0) {
      const improvementSuggestions = await this.generateScheduleImprovements(
        result,
        tasks
      )
      result.suggestions.push(...improvementSuggestions)
    }

    return result
  }

  /**
   * AIでスケジュール改善案を生成
   */
  private async generateScheduleImprovements(
    scheduleResult: SchedulingResult,
    tasks: GeneratedTask[]
  ): Promise<string[]> {
    const criticalWarnings = scheduleResult.warnings.filter(w => w.severity === 'critical')
    
    if (criticalWarnings.length === 0) {
      return []
    }

    const prompt = `
以下のプロジェクトスケジュールに深刻な問題があります。改善案を提案してください。

問題:
${criticalWarnings.map(w => `- ${w.message}`).join('\n')}

タスク数: ${tasks.length}
クリティカルパス: ${scheduleResult.criticalPath.length}タスク
リソース使用率: ${scheduleResult.utilizationRate.toFixed(1)}%

改善案を3つ以内で簡潔に提案してください。
JSON形式で以下の形式で回答:
{
  "improvements": [
    "改善案1",
    "改善案2",
    "改善案3"
  ]
}
`

    try {
      const result = await this.geminiService.generateContent(prompt, 0.7)
      const parsed = JSON.parse(result)
      return parsed.improvements || []
    } catch (error) {
      console.error('Failed to generate schedule improvements:', error)
      return [
        'タスクの優先順位を見直して、重要度の低いタスクを後回しにする',
        '並列作業可能なタスクを特定し、チームメンバーで分担する',
        '各タスクの見積もり時間を再評価し、過大な見積もりを修正する'
      ]
    }
  }

  /**
   * タイトなスケジュールを自動で緩和
   */
  async relaxTightSchedule(
    tasks: GeneratedTask[],
    scheduleResult: SchedulingResult,
    additionalDays: number = 0
  ): Promise<{
    adjustedTasks: GeneratedTask[]
    newEndDate: Date
    adjustments: string[]
  }> {
    const adjustments: string[] = []
    const adjustedTasks = [...tasks]
    
    // クリティカルパス以外のタスクの見積もりを削減
    const nonCriticalTasks = adjustedTasks.filter(
      task => !scheduleResult.criticalPath.includes(`task_${tasks.indexOf(task) + 1}`)
    )
    
    nonCriticalTasks.forEach(task => {
      const reduction = Math.min(task.estimatedHours * 0.2, 4) // 最大20%または4時間削減
      if (reduction > 0) {
        task.estimatedHours -= reduction
        adjustments.push(`「${task.title}」の見積もり時間を${reduction.toFixed(1)}時間削減`)
      }
    })

    // 依存関係の最適化
    const parallelizableTasks = this.findParallelizableTasks(adjustedTasks)
    parallelizableTasks.forEach(taskGroup => {
      if (taskGroup.length > 1) {
        // 依存関係を削除して並列化
        taskGroup.forEach((task, index) => {
          if (index > 0) {
            task.dependencies = []
            adjustments.push(`「${task.title}」を並列実行可能に変更`)
          }
        })
      }
    })

    // 新しい終了日を計算
    const originalEndDate = scheduleResult.schedules[scheduleResult.schedules.length - 1]?.dueDate
    const newEndDate = new Date(originalEndDate)
    newEndDate.setDate(newEndDate.getDate() + additionalDays)

    return {
      adjustedTasks,
      newEndDate,
      adjustments
    }
  }

  /**
   * 並列化可能なタスクを特定
   */
  private findParallelizableTasks(tasks: GeneratedTask[]): GeneratedTask[][] {
    const groups: GeneratedTask[][] = []
    const visited = new Set<string>()

    tasks.forEach(task => {
      if (visited.has(task.title)) return

      // 同じカテゴリで依存関係がないタスクをグループ化
      const group = tasks.filter(t => 
        t.category === task.category &&
        t.dependencies.length === 0 &&
        !visited.has(t.title)
      )

      if (group.length > 1) {
        group.forEach(t => visited.add(t.title))
        groups.push(group)
      }
    })

    return groups
  }
}