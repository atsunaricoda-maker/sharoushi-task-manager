interface TaskTemplate {
  name: string
  description: string
  task_type: 'regular' | 'irregular'
  frequency?: string
  estimated_hours: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

interface GeneratedTask {
  title: string
  description: string
  task_type: 'regular' | 'irregular'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  due_date: string
  estimated_hours: number
}

export class GeminiService {
  private apiKey: string
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateTasksFromClientInfo(
    clientName: string,
    employeeCount: number,
    contractPlan: string,
    currentMonth: string
  ): Promise<GeneratedTask[]> {
    const prompt = `
あなたは日本の社労士事務所のアシスタントです。以下の顧問先情報から、今月必要な業務タスクを生成してください。

顧問先情報：
- 企業名: ${clientName}
- 従業員数: ${employeeCount}名
- 契約プラン: ${contractPlan}
- 対象月: ${currentMonth}

以下の形式でタスクを5〜8個生成してください：
1. 定期業務（給与計算、社会保険料算定など）
2. 季節業務（算定基礎届、年末調整、労働保険料申告など該当する場合）
3. 法改正対応（最新の労働法改正に関する対応が必要な場合）

各タスクには以下の情報を含めてください：
- タイトル（30文字以内）
- 説明（100文字以内）
- タスクタイプ（regular/irregular）
- 優先度（urgent/high/medium/low）
- 期限（YYYY-MM-DD形式）
- 予定工数（時間）

JSON形式で出力してください。
`

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      const generatedText = data.candidates[0].content.parts[0].text

      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Failed to parse Gemini response')
      }

      const tasks = JSON.parse(jsonMatch[0]) as GeneratedTask[]
      return tasks
    } catch (error) {
      console.error('Gemini API error:', error)
      // Fallback to default tasks
      return this.getDefaultTasks(currentMonth)
    }
  }

  async generateTaskDescription(taskTitle: string): Promise<string> {
    const prompt = `
社労士業務のタスク「${taskTitle}」について、以下の観点で詳細な作業内容を100文字程度で説明してください：
1. 具体的な作業内容
2. 必要な書類や情報
3. 注意点や確認事項
`

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 256,
          }
        })
      })

      const data = await response.json()
      return data.candidates[0].content.parts[0].text.trim()
    } catch (error) {
      console.error('Gemini API error:', error)
      return `${taskTitle}の処理を行います。`
    }
  }

  async suggestTaskPriority(
    taskTitle: string,
    dueDate: string,
    clientImportance: 'high' | 'medium' | 'low'
  ): Promise<'urgent' | 'high' | 'medium' | 'low'> {
    const daysUntilDue = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue <= 2) return 'urgent'
    if (daysUntilDue <= 7 && clientImportance === 'high') return 'high'
    if (daysUntilDue <= 14) return 'medium'
    return 'low'
  }

  private getDefaultTasks(month: string): GeneratedTask[] {
    const year = new Date().getFullYear()
    const monthNum = parseInt(month.split('-')[1])
    
    const tasks: GeneratedTask[] = [
      {
        title: `${monthNum}月分給与計算`,
        description: '給与計算と給与明細の作成、振込データの準備',
        task_type: 'regular',
        priority: 'high',
        due_date: `${year}-${String(monthNum).padStart(2, '0')}-25`,
        estimated_hours: 3.0
      },
      {
        title: `${monthNum}月分社会保険料算定`,
        description: '社会保険料の算定と納付書の作成',
        task_type: 'regular',
        priority: 'high',
        due_date: `${year}-${String(monthNum).padStart(2, '0')}-25`,
        estimated_hours: 2.0
      }
    ]

    // 季節業務の追加
    if (monthNum === 7) {
      tasks.push({
        title: '算定基礎届の提出',
        description: '4-6月の報酬をもとに標準報酬月額の算定と届出',
        task_type: 'regular',
        priority: 'urgent',
        due_date: `${year}-07-10`,
        estimated_hours: 5.0
      })
    }

    if (monthNum === 6) {
      tasks.push({
        title: '労働保険年度更新',
        description: '労働保険料の申告と納付手続き',
        task_type: 'regular',
        priority: 'high',
        due_date: `${year}-07-10`,
        estimated_hours: 4.0
      })
    }

    if (monthNum === 12) {
      tasks.push({
        title: '年末調整準備',
        description: '年末調整に必要な書類の配布と回収',
        task_type: 'regular',
        priority: 'high',
        due_date: `${year}-12-15`,
        estimated_hours: 6.0
      })
    }

    return tasks
  }
}