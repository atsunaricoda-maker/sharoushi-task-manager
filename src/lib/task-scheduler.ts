/**
 * タスクスケジューラー
 * プロジェクトの期限に基づいてタスクの期限を自動調整
 */

export interface TaskSchedule {
  taskId: string
  title: string
  startDate: Date
  dueDate: Date
  estimatedHours: number
  dependencies: string[]
  assignee?: string
  bufferDays: number // バッファ日数
  isCriticalPath: boolean // クリティカルパスかどうか
}

export interface SchedulingOptions {
  projectStartDate: Date
  projectEndDate: Date
  workingHoursPerDay: number // 1日の作業可能時間（デフォルト: 8時間）
  bufferRatio: number // バッファ比率（デフォルト: 0.2 = 20%）
  excludeWeekends: boolean // 週末を除外するか
  excludeHolidays: boolean // 祝日を除外するか
  parallelTaskLimit: number // 同時並行可能なタスク数
  tightScheduleThreshold: number // タイトなスケジュールの閾値（0-1）
}

export interface SchedulingResult {
  schedules: TaskSchedule[]
  totalDuration: number // 総期間（日）
  criticalPath: string[] // クリティカルパスのタスクID
  utilizationRate: number // リソース使用率（0-100%）
  warnings: SchedulingWarning[]
  suggestions: string[]
}

export interface SchedulingWarning {
  type: 'tight_schedule' | 'overallocation' | 'dependency_conflict' | 'impossible_deadline'
  taskId?: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class TaskScheduler {
  private holidays: Set<string> = new Set() // YYYY-MM-DD形式の祝日

  constructor() {
    // 2025年の日本の祝日（例）
    this.holidays = new Set([
      '2025-01-01', '2025-01-13', '2025-02-11', '2025-02-23',
      '2025-03-20', '2025-04-29', '2025-05-03', '2025-05-04',
      '2025-05-05', '2025-05-06', '2025-07-21', '2025-08-11',
      '2025-09-15', '2025-09-23', '2025-10-13', '2025-11-03',
      '2025-11-23', '2025-11-24'
    ])
  }

  /**
   * プロジェクト期限に基づいてタスクスケジュールを自動生成
   */
  generateSchedule(
    tasks: any[],
    options: SchedulingOptions
  ): SchedulingResult {
    const warnings: SchedulingWarning[] = []
    const suggestions: string[] = []
    
    // デフォルト値の設定
    const opts = {
      workingHoursPerDay: 8,
      bufferRatio: 0.2,
      excludeWeekends: true,
      excludeHolidays: true,
      parallelTaskLimit: 3,
      tightScheduleThreshold: 0.8,
      ...options
    }

    // 利用可能な作業日数を計算
    const availableWorkDays = this.calculateWorkDays(
      opts.projectStartDate,
      opts.projectEndDate,
      opts.excludeWeekends,
      opts.excludeHolidays
    )

    // 総作業時間を計算
    const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 2), 0)
    const requiredDays = Math.ceil(totalEstimatedHours / opts.workingHoursPerDay)

    // スケジュールがタイトかチェック
    const utilizationRate = (requiredDays / availableWorkDays) * 100
    if (utilizationRate > opts.tightScheduleThreshold * 100) {
      warnings.push({
        type: 'tight_schedule',
        message: `スケジュールが非常にタイトです（使用率: ${utilizationRate.toFixed(1)}%）`,
        severity: utilizationRate > 100 ? 'critical' : 'high'
      })

      if (utilizationRate > 100) {
        suggestions.push('期限の延長を検討してください')
        suggestions.push('タスクの並列化を増やすことを検討してください')
        suggestions.push('一部タスクの簡略化を検討してください')
      }
    }

    // タスクの依存関係を解析
    const taskGraph = this.buildDependencyGraph(tasks)
    const sortedTasks = this.topologicalSort(taskGraph)
    const criticalPath = this.findCriticalPath(sortedTasks, taskGraph)

    // スケジュールを生成
    const schedules = this.allocateTasks(
      sortedTasks,
      taskGraph,
      criticalPath,
      opts,
      warnings
    )

    // リソースの競合をチェック
    this.checkResourceConflicts(schedules, opts, warnings)

    // 最適化の提案
    if (warnings.some(w => w.severity === 'high' || w.severity === 'critical')) {
      suggestions.push(...this.generateOptimizationSuggestions(schedules, opts))
    }

    return {
      schedules,
      totalDuration: availableWorkDays,
      criticalPath,
      utilizationRate: Math.min(100, utilizationRate),
      warnings,
      suggestions
    }
  }

  /**
   * タスクを期間内に割り当て
   */
  private allocateTasks(
    tasks: any[],
    taskGraph: Map<string, any>,
    criticalPath: string[],
    options: SchedulingOptions,
    warnings: SchedulingWarning[]
  ): TaskSchedule[] {
    const schedules: TaskSchedule[] = []
    const taskEndDates = new Map<string, Date>()
    
    // プロジェクトの総日数
    const projectDays = this.calculateWorkDays(
      options.projectStartDate,
      options.projectEndDate,
      options.excludeWeekends,
      options.excludeHolidays
    )

    for (const task of tasks) {
      const isCritical = criticalPath.includes(task.id || task.title)
      
      // 依存タスクの最終日を取得
      let startDate = new Date(options.projectStartDate)
      if (task.dependencies && task.dependencies.length > 0) {
        const depEndDates = task.dependencies
          .map((dep: string) => taskEndDates.get(dep))
          .filter((d: Date | undefined) => d !== undefined) as Date[]
        
        if (depEndDates.length > 0) {
          startDate = new Date(Math.max(...depEndDates.map(d => d.getTime())))
          startDate.setDate(startDate.getDate() + 1) // 翌日から開始
        }
      }

      // 作業日数を計算（バッファを含む）
      const workDays = Math.ceil(task.estimatedHours / options.workingHoursPerDay)
      const bufferDays = isCritical ? 
        Math.ceil(workDays * options.bufferRatio * 0.5) : // クリティカルパスは少なめ
        Math.ceil(workDays * options.bufferRatio)
      
      const totalDays = workDays + bufferDays

      // 終了日を計算
      let dueDate = this.addWorkDays(
        startDate,
        totalDays,
        options.excludeWeekends,
        options.excludeHolidays
      )

      // プロジェクト期限を超える場合の調整
      if (dueDate > options.projectEndDate) {
        const overflow = this.calculateWorkDays(
          options.projectEndDate,
          dueDate,
          options.excludeWeekends,
          options.excludeHolidays
        )

        // バッファを削減
        if (bufferDays > 0) {
          const reducedBuffer = Math.max(0, bufferDays - overflow)
          dueDate = this.addWorkDays(
            startDate,
            workDays + reducedBuffer,
            options.excludeWeekends,
            options.excludeHolidays
          )
          
          if (reducedBuffer === 0) {
            warnings.push({
              type: 'tight_schedule',
              taskId: task.id || task.title,
              message: `タスク「${task.title}」のバッファが完全に削除されました`,
              severity: 'high'
            })
          }
        }

        // それでも超える場合
        if (dueDate > options.projectEndDate) {
          // 並列化を検討
          if (!isCritical && task.dependencies.length === 0) {
            // 開始日を前倒し
            const earlierStart = this.findEarlierStartDate(
              schedules,
              workDays,
              options
            )
            if (earlierStart < startDate) {
              startDate = earlierStart
              dueDate = this.addWorkDays(
                startDate,
                workDays,
                options.excludeWeekends,
                options.excludeHolidays
              )
            }
          }

          // 最終的に期限を超える場合は警告
          if (dueDate > options.projectEndDate) {
            dueDate = options.projectEndDate
            warnings.push({
              type: 'impossible_deadline',
              taskId: task.id || task.title,
              message: `タスク「${task.title}」が期限内に完了できません`,
              severity: 'critical'
            })
          }
        }
      }

      const schedule: TaskSchedule = {
        taskId: task.id || task.title,
        title: task.title,
        startDate,
        dueDate,
        estimatedHours: task.estimatedHours || 2,
        dependencies: task.dependencies || [],
        assignee: task.assignee,
        bufferDays: Math.max(0, bufferDays),
        isCriticalPath: isCritical
      }

      schedules.push(schedule)
      taskEndDates.set(task.id || task.title, dueDate)
    }

    return schedules
  }

  /**
   * 作業日数を計算
   */
  private calculateWorkDays(
    startDate: Date,
    endDate: Date,
    excludeWeekends: boolean,
    excludeHolidays: boolean
  ): number {
    let count = 0
    const current = new Date(startDate)
    
    while (current <= endDate) {
      if (this.isWorkDay(current, excludeWeekends, excludeHolidays)) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }
    
    return count
  }

  /**
   * 作業日を追加
   */
  private addWorkDays(
    startDate: Date,
    days: number,
    excludeWeekends: boolean,
    excludeHolidays: boolean
  ): Date {
    const result = new Date(startDate)
    let addedDays = 0
    
    while (addedDays < days) {
      result.setDate(result.getDate() + 1)
      if (this.isWorkDay(result, excludeWeekends, excludeHolidays)) {
        addedDays++
      }
    }
    
    return result
  }

  /**
   * 作業日かどうかチェック
   */
  private isWorkDay(
    date: Date,
    excludeWeekends: boolean,
    excludeHolidays: boolean
  ): boolean {
    // 週末チェック
    if (excludeWeekends) {
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false
      }
    }
    
    // 祝日チェック
    if (excludeHolidays) {
      const dateStr = this.formatDate(date)
      if (this.holidays.has(dateStr)) {
        return false
      }
    }
    
    return true
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 依存関係グラフを構築
   */
  private buildDependencyGraph(tasks: any[]): Map<string, any> {
    const graph = new Map()
    
    tasks.forEach(task => {
      graph.set(task.id || task.title, {
        ...task,
        predecessors: task.dependencies || [],
        successors: []
      })
    })
    
    // 後続タスクを設定
    tasks.forEach(task => {
      (task.dependencies || []).forEach((dep: string) => {
        const depTask = graph.get(dep)
        if (depTask) {
          depTask.successors.push(task.id || task.title)
        }
      })
    })
    
    return graph
  }

  /**
   * トポロジカルソート
   */
  private topologicalSort(graph: Map<string, any>): any[] {
    const visited = new Set<string>()
    const result: any[] = []
    
    const visit = (taskId: string) => {
      if (visited.has(taskId)) return
      visited.add(taskId)
      
      const task = graph.get(taskId)
      if (!task) return
      
      // 依存タスクを先に処理
      task.predecessors.forEach((dep: string) => visit(dep))
      result.push(task)
    }
    
    graph.forEach((_, taskId) => visit(taskId))
    return result
  }

  /**
   * クリティカルパスを検出
   */
  private findCriticalPath(tasks: any[], graph: Map<string, any>): string[] {
    const earliestStart = new Map<string, number>()
    const earliestFinish = new Map<string, number>()
    const latestStart = new Map<string, number>()
    const latestFinish = new Map<string, number>()
    
    // Forward pass
    tasks.forEach(task => {
      const taskId = task.id || task.title
      const duration = Math.ceil((task.estimatedHours || 2) / 8)
      
      const start = task.predecessors.length === 0 ? 0 :
        Math.max(...task.predecessors.map((p: string) => earliestFinish.get(p) || 0))
      
      earliestStart.set(taskId, start)
      earliestFinish.set(taskId, start + duration)
    })
    
    // プロジェクト終了時間
    const projectDuration = Math.max(...Array.from(earliestFinish.values()))
    
    // Backward pass
    tasks.slice().reverse().forEach(task => {
      const taskId = task.id || task.title
      const duration = Math.ceil((task.estimatedHours || 2) / 8)
      
      const finish = task.successors.length === 0 ? projectDuration :
        Math.min(...task.successors.map((s: string) => latestStart.get(s) || projectDuration))
      
      latestFinish.set(taskId, finish)
      latestStart.set(taskId, finish - duration)
    })
    
    // クリティカルパスの特定
    const criticalPath: string[] = []
    tasks.forEach(task => {
      const taskId = task.id || task.title
      const slack = (latestStart.get(taskId) || 0) - (earliestStart.get(taskId) || 0)
      
      if (slack === 0) {
        criticalPath.push(taskId)
      }
    })
    
    return criticalPath
  }

  /**
   * リソース競合をチェック
   */
  private checkResourceConflicts(
    schedules: TaskSchedule[],
    options: SchedulingOptions,
    warnings: SchedulingWarning[]
  ): void {
    // 日付ごとの同時実行タスク数をチェック
    const dateTaskCount = new Map<string, number>()
    
    schedules.forEach(schedule => {
      const current = new Date(schedule.startDate)
      while (current <= schedule.dueDate) {
        if (this.isWorkDay(current, options.excludeWeekends, options.excludeHolidays)) {
          const dateStr = this.formatDate(current)
          dateTaskCount.set(dateStr, (dateTaskCount.get(dateStr) || 0) + 1)
        }
        current.setDate(current.getDate() + 1)
      }
    })
    
    // 並列制限を超える日をチェック
    let overallocationDays = 0
    dateTaskCount.forEach((count, date) => {
      if (count > options.parallelTaskLimit) {
        overallocationDays++
      }
    })
    
    if (overallocationDays > 0) {
      warnings.push({
        type: 'overallocation',
        message: `${overallocationDays}日間で並列タスク数が制限を超えています`,
        severity: overallocationDays > 5 ? 'high' : 'medium'
      })
    }
  }

  /**
   * より早い開始日を探す
   */
  private findEarlierStartDate(
    existingSchedules: TaskSchedule[],
    requiredDays: number,
    options: SchedulingOptions
  ): Date {
    // 既存スケジュールの空き時間を探す
    const occupiedDates = new Set<string>()
    
    existingSchedules.forEach(schedule => {
      const current = new Date(schedule.startDate)
      while (current <= schedule.dueDate) {
        if (this.isWorkDay(current, options.excludeWeekends, options.excludeHolidays)) {
          occupiedDates.add(this.formatDate(current))
        }
        current.setDate(current.getDate() + 1)
      }
    })
    
    // プロジェクト開始日から空いている期間を探す
    const searchStart = new Date(options.projectStartDate)
    let consecutiveDays = 0
    let potentialStart = searchStart
    
    while (searchStart < options.projectEndDate) {
      const dateStr = this.formatDate(searchStart)
      
      if (!occupiedDates.has(dateStr) && 
          this.isWorkDay(searchStart, options.excludeWeekends, options.excludeHolidays)) {
        if (consecutiveDays === 0) {
          potentialStart = new Date(searchStart)
        }
        consecutiveDays++
        
        if (consecutiveDays >= requiredDays) {
          return potentialStart
        }
      } else {
        consecutiveDays = 0
      }
      
      searchStart.setDate(searchStart.getDate() + 1)
    }
    
    return new Date(options.projectStartDate)
  }

  /**
   * 最適化の提案を生成
   */
  private generateOptimizationSuggestions(
    schedules: TaskSchedule[],
    options: SchedulingOptions
  ): string[] {
    const suggestions: string[] = []
    
    // クリティカルパスのタスクを特定
    const criticalTasks = schedules.filter(s => s.isCriticalPath)
    if (criticalTasks.length > 0) {
      suggestions.push(`クリティカルパス上の${criticalTasks.length}個のタスクを優先的に処理してください`)
    }
    
    // バッファが少ないタスクを特定
    const tightTasks = schedules.filter(s => s.bufferDays === 0)
    if (tightTasks.length > 0) {
      suggestions.push(`${tightTasks.length}個のタスクにバッファがありません。リスク管理を強化してください`)
    }
    
    // 並列化可能なタスクを特定
    const independentTasks = schedules.filter(s => s.dependencies.length === 0)
    if (independentTasks.length > options.parallelTaskLimit) {
      suggestions.push(`${independentTasks.length}個の独立したタスクがあります。チーム分担を検討してください`)
    }
    
    return suggestions
  }

  /**
   * スケジュールをガントチャート用のデータに変換
   */
  formatForGanttChart(schedules: TaskSchedule[]): any[] {
    return schedules.map(schedule => ({
      id: schedule.taskId,
      text: schedule.title,
      start_date: this.formatDate(schedule.startDate),
      end_date: this.formatDate(schedule.dueDate),
      duration: this.calculateWorkDays(
        schedule.startDate,
        schedule.dueDate,
        true,
        true
      ),
      progress: 0,
      parent: 0,
      type: schedule.isCriticalPath ? 'critical' : 'normal',
      buffer: schedule.bufferDays,
      dependencies: schedule.dependencies.join(',')
    }))
  }
}