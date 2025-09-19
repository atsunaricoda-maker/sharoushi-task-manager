/**
 * Cloudflare Workers Scheduled Events Handler
 * Cronトリガーで定期実行される処理
 */

import { SubsidyFetcher } from './lib/subsidy-fetcher'

type Env = {
  DB: D1Database
  KV: KVNamespace
  SENDGRID_API_KEY?: string
  SENDGRID_FROM_EMAIL?: string
}

/**
 * Scheduled event handler
 * wrangler.tomlのtriggers.cronsで設定された時刻に実行される
 */
export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log('Scheduled event triggered at:', new Date().toISOString())
  console.log('Cron expression:', event.cron)

  switch (event.cron) {
    // 毎週月曜日の助成金情報更新
    case '0 6 * * MON':
      await updateSubsidyInformation(env)
      break
    
    // 毎日の期限チェック（将来的に追加可能）
    case '0 0 * * *':
      await checkDeadlines(env)
      break
    
    default:
      console.log('Unknown cron trigger:', event.cron)
  }
}

/**
 * 助成金情報の自動更新
 */
async function updateSubsidyInformation(env: Env): Promise<void> {
  try {
    console.log('Starting subsidy information update...')
    
    const fetcher = new SubsidyFetcher(env.DB)
    
    // 全ソースから取得
    const subsidies = await fetcher.fetchAll()
    
    // データベースを更新
    await fetcher.updateDatabase(subsidies)
    
    // 更新結果をKVに記録（ログとして）
    const updateLog = {
      timestamp: new Date().toISOString(),
      count: subsidies.length,
      sources: {
        mhlw: subsidies.filter(s => s.managing_organization === '厚生労働省').length,
        meti: subsidies.filter(s => s.managing_organization === '経済産業省').length,
        other: subsidies.filter(s => 
          s.managing_organization !== '厚生労働省' && 
          s.managing_organization !== '経済産業省'
        ).length
      }
    }
    
    await env.KV.put(
      `subsidy_update_log:${Date.now()}`,
      JSON.stringify(updateLog),
      { expirationTtl: 60 * 60 * 24 * 30 } // 30日間保持
    )
    
    console.log('Subsidy update completed:', updateLog)
    
    // 管理者にメール通知（SendGridが設定されている場合）
    if (env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL) {
      await sendUpdateNotification(env, updateLog)
    }
  } catch (error) {
    console.error('Failed to update subsidy information:', error)
    
    // エラーログをKVに記録
    await env.KV.put(
      `subsidy_update_error:${Date.now()}`,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { expirationTtl: 60 * 60 * 24 * 7 } // 7日間保持
    )
  }
}

/**
 * 期限チェック処理
 */
async function checkDeadlines(env: Env): Promise<void> {
  try {
    console.log('Checking subsidy application deadlines...')
    
    // 期限が近い申請を取得
    const upcomingDeadlines = await env.DB.prepare(`
      SELECT 
        sa.id,
        sa.application_number,
        s.name as subsidy_name,
        c.company_name as client_name,
        sa.deadline,
        JULIANDAY(sa.deadline) - JULIANDAY(CURRENT_DATE) as days_remaining
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      WHERE sa.status IN ('preparing', 'submitted')
        AND sa.deadline IS NOT NULL
        AND JULIANDAY(sa.deadline) - JULIANDAY(CURRENT_DATE) <= 14
      ORDER BY sa.deadline
    `).all()
    
    if (upcomingDeadlines.results && upcomingDeadlines.results.length > 0) {
      console.log(`Found ${upcomingDeadlines.results.length} applications with upcoming deadlines`)
      
      // 通知を送信（実装は省略）
      // await sendDeadlineReminders(env, upcomingDeadlines.results)
    }
  } catch (error) {
    console.error('Failed to check deadlines:', error)
  }
}

/**
 * 更新完了通知メールを送信
 */
async function sendUpdateNotification(env: Env, updateLog: any): Promise<void> {
  try {
    const emailBody = `
      <h2>助成金情報の自動更新が完了しました</h2>
      <p>更新日時: ${new Date(updateLog.timestamp).toLocaleString('ja-JP')}</p>
      <p>更新件数: ${updateLog.count}件</p>
      <ul>
        <li>厚生労働省: ${updateLog.sources.mhlw}件</li>
        <li>経済産業省: ${updateLog.sources.meti}件</li>
        <li>その他: ${updateLog.sources.other}件</li>
      </ul>
      <p>システムにログインして詳細をご確認ください。</p>
    `
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'admin@example.com' }] // 管理者メールアドレス
        }],
        from: {
          email: env.SENDGRID_FROM_EMAIL,
          name: '助成金管理システム'
        },
        subject: '【自動通知】助成金情報更新完了',
        content: [{
          type: 'text/html',
          value: emailBody
        }]
      })
    })
    
    if (!response.ok) {
      console.error('Failed to send notification email:', await response.text())
    }
  } catch (error) {
    console.error('Failed to send update notification:', error)
  }
}