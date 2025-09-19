/**
 * 助成金情報自動取得サービス
 * 厚生労働省等の公式サイトから助成金情報を取得・更新
 */

import { D1Database } from '@cloudflare/workers-types'

export interface SubsidyInfo {
  name: string
  category: string
  managing_organization: string
  description: string
  requirements?: string
  required_documents?: string
  max_amount?: number
  subsidy_rate?: number
  application_period_type?: string
  application_start_date?: string
  application_end_date?: string
  url?: string
  is_active: boolean
}

// 厚労省の主要な助成金リスト（定期的に更新が必要）
const MHLW_SUBSIDIES = [
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07_20200515.html',
    name: '雇用調整助成金',
    category: '雇用維持'
  },
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
    name: 'キャリアアップ助成金',
    category: '人材育成'
  },
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html',
    name: '人材開発支援助成金',
    category: '人材育成'
  },
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/shokuba_kosodate/ryouritsu01/',
    name: '両立支援等助成金',
    category: '働き方改革'
  },
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html',
    name: '業務改善助成金',
    category: '生産性向上'
  },
  {
    url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000120692.html',
    name: '働き方改革推進支援助成金',
    category: '働き方改革'
  }
]

export class SubsidyFetcher {
  constructor(private db: D1Database) {}

  /**
   * 厚労省のウェブサイトから助成金情報を取得
   */
  async fetchFromMHLW(): Promise<SubsidyInfo[]> {
    const subsidies: SubsidyInfo[] = []
    
    for (const subsidy of MHLW_SUBSIDIES) {
      try {
        // URLから詳細情報を取得
        const response = await fetch(subsidy.url)
        const html = await response.text()
        
        // HTMLから情報を抽出（簡易的なパーサー）
        const subsidyInfo = this.parseSubsidyHTML(html, subsidy)
        subsidies.push(subsidyInfo)
      } catch (error) {
        console.error(`Failed to fetch ${subsidy.name}:`, error)
      }
    }
    
    return subsidies
  }

  /**
   * HTMLから助成金情報を抽出
   */
  private parseSubsidyHTML(html: string, baseInfo: any): SubsidyInfo {
    // 基本情報を設定
    const subsidyInfo: SubsidyInfo = {
      name: baseInfo.name,
      category: baseInfo.category,
      managing_organization: '厚生労働省',
      description: '',
      url: baseInfo.url,
      is_active: true
    }

    // 助成金額の抽出（例：「最大○○万円」のパターンを探す）
    const amountMatch = html.match(/最大[\s]*?(\d+[\d,]*)\s*万円/i)
    if (amountMatch) {
      subsidyInfo.max_amount = parseInt(amountMatch[1].replace(/,/g, '')) * 10000
    }

    // 助成率の抽出（例：「2/3」「1/2」など）
    const rateMatch = html.match(/助成率[\s]*[:：]?[\s]*([0-9０-９]+[/／][0-9０-９]+)/i)
    if (rateMatch) {
      const [numerator, denominator] = rateMatch[1].split(/[/／]/).map(n => parseInt(n))
      subsidyInfo.subsidy_rate = numerator / denominator
    }

    // 申請期限の抽出
    const deadlineMatch = html.match(/申請期限[\s]*[:：]?[\s]*(\d{4}年\d{1,2}月\d{1,2}日)/i)
    if (deadlineMatch) {
      subsidyInfo.application_end_date = this.parseJapaneseDate(deadlineMatch[1])
    }

    // 概要の抽出（metaタグから）
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    if (descMatch) {
      subsidyInfo.description = descMatch[1]
    }

    return subsidyInfo
  }

  /**
   * 日本語の日付をISO形式に変換
   */
  private parseJapaneseDate(dateStr: string): string {
    const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match) {
      const [_, year, month, day] = match
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return ''
  }

  /**
   * データベースに助成金情報を保存・更新
   */
  async updateDatabase(subsidies: SubsidyInfo[]): Promise<void> {
    for (const subsidy of subsidies) {
      try {
        // 既存の助成金情報があるかチェック
        const existing = await this.db.prepare(`
          SELECT id FROM subsidies WHERE name = ? AND managing_organization = ?
        `).bind(subsidy.name, subsidy.managing_organization).first()

        if (existing) {
          // 更新
          await this.db.prepare(`
            UPDATE subsidies SET
              category = ?,
              description = ?,
              max_amount = ?,
              subsidy_rate = ?,
              requirements = ?,
              required_documents = ?,
              application_end_date = ?,
              url = ?,
              is_active = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            subsidy.category,
            subsidy.description,
            subsidy.max_amount,
            subsidy.subsidy_rate,
            subsidy.requirements,
            subsidy.required_documents,
            subsidy.application_end_date,
            subsidy.url,
            subsidy.is_active ? 1 : 0,
            existing.id
          ).run()
        } else {
          // 新規作成
          await this.db.prepare(`
            INSERT INTO subsidies (
              name, category, managing_organization, description,
              max_amount, subsidy_rate, requirements, required_documents,
              application_end_date, url, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            subsidy.name,
            subsidy.category,
            subsidy.managing_organization,
            subsidy.description,
            subsidy.max_amount,
            subsidy.subsidy_rate,
            subsidy.requirements,
            subsidy.required_documents,
            subsidy.application_end_date,
            subsidy.url,
            subsidy.is_active ? 1 : 0
          ).run()
        }
      } catch (error) {
        console.error(`Failed to update ${subsidy.name}:`, error)
      }
    }
  }

  /**
   * 政府の補助金検索サイトから情報を取得
   * jGrants（補助金電子申請システム）のAPIを使用
   */
  async fetchFromJGrants(): Promise<SubsidyInfo[]> {
    const subsidies: SubsidyInfo[] = []
    
    // jGrantsの検索APIエンドポイント（仮）
    // 実際のAPIエンドポイントは要確認
    const apiUrl = 'https://api.jgrants-portal.go.jp/v1/subsidies'
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // APIレスポンスをSubsidyInfo形式に変換
        for (const item of data.subsidies || []) {
          subsidies.push({
            name: item.name,
            category: item.category || '補助金',
            managing_organization: item.organization || '経済産業省',
            description: item.description,
            requirements: item.requirements,
            required_documents: item.documents?.join('、'),
            max_amount: item.max_amount,
            subsidy_rate: item.subsidy_rate,
            application_start_date: item.start_date,
            application_end_date: item.end_date,
            url: item.url,
            is_active: item.is_active !== false
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch from jGrants:', error)
    }
    
    return subsidies
  }

  /**
   * ミラサポplusから補助金情報を取得
   */
  async fetchFromMirasapo(): Promise<SubsidyInfo[]> {
    const subsidies: SubsidyInfo[] = []
    
    // ミラサポplusの補助金一覧ページ
    const url = 'https://mirasapo-plus.go.jp/subsidy/'
    
    try {
      const response = await fetch(url)
      const html = await response.text()
      
      // HTMLから補助金情報を抽出
      // 実際の実装ではより詳細なパーサーが必要
      const matches = html.matchAll(/<div class="subsidy-item"[^>]*>(.*?)<\/div>/gs)
      
      for (const match of matches) {
        const itemHtml = match[1]
        
        // 各項目から情報を抽出
        const nameMatch = itemHtml.match(/<h3[^>]*>(.*?)<\/h3>/i)
        const orgMatch = itemHtml.match(/実施機関[:：]\s*(.*?)</i)
        const amountMatch = itemHtml.match(/補助上限[:：]\s*([\d,]+)万円/i)
        
        if (nameMatch) {
          subsidies.push({
            name: nameMatch[1].trim(),
            category: '中小企業支援',
            managing_organization: orgMatch ? orgMatch[1].trim() : '経済産業省',
            description: '',
            max_amount: amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) * 10000 : undefined,
            url: url,
            is_active: true
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch from Mirasapo:', error)
    }
    
    return subsidies
  }

  /**
   * 全ソースから助成金情報を取得して統合
   */
  async fetchAll(): Promise<SubsidyInfo[]> {
    const allSubsidies: SubsidyInfo[] = []
    
    // 各ソースから並行して取得
    const [mhlwSubsidies, jGrantsSubsidies, mirasapoSubsidies] = await Promise.all([
      this.fetchFromMHLW(),
      this.fetchFromJGrants(),
      this.fetchFromMirasapo()
    ])
    
    // 統合（重複を除去）
    const subsidyMap = new Map<string, SubsidyInfo>()
    
    for (const subsidy of [...mhlwSubsidies, ...jGrantsSubsidies, ...mirasapoSubsidies]) {
      const key = `${subsidy.name}_${subsidy.managing_organization}`
      if (!subsidyMap.has(key)) {
        subsidyMap.set(key, subsidy)
      }
    }
    
    return Array.from(subsidyMap.values())
  }
}