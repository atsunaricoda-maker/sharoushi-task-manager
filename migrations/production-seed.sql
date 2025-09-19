-- ===================================================
-- 本番環境用初期データ
-- ===================================================
-- 注意: このファイルには本番環境で必要な最小限のマスタデータのみ含めます
-- テストデータは含めないこと！

-- デフォルトの管理者ユーザー（初回ログイン後にGoogle OAuthで上書きされます）
INSERT OR IGNORE INTO users (id, email, name, role) VALUES 
(1, 'admin@example.com', '管理者', 'admin');

-- よく使用される助成金テンプレート（実際の助成金情報）
INSERT OR IGNORE INTO subsidies (name, category, managing_organization, max_amount, requirements, required_documents, description, url, is_active) VALUES 
('雇用調整助成金', '雇用維持', '厚生労働省', 15000, '経済上の理由により事業活動の縮小を余儀なくされた事業主', '事業計画書、雇用調整実施計画届、休業実施計画書', '労働者の雇用維持を図る事業主に対して、休業手当等の一部を助成', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07.html', 1),
('キャリアアップ助成金', '人材育成', '厚生労働省', 720000, '有期雇用労働者、短時間労働者、派遣労働者を企業内でキャリアアップさせた事業主', '労働者名簿、賃金台帳、雇用契約書、キャリアアップ計画書', '非正規雇用労働者の企業内でのキャリアアップを促進', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html', 1),
('両立支援等助成金', '働き方改革', '厚生労働省', 600000, '仕事と家庭の両立支援に取り組む事業主', '就業規則、育児休業取得者の証明書類', '職業生活と家庭生活が両立できる職場環境づくり', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/shokuba_kosodate/ryouritsu01/', 1),
('人材開発支援助成金', '人材育成', '厚生労働省', 3000000, '職業訓練等を実施する事業主', '訓練計画書、訓練実施報告書、賃金台帳', '労働者の職業能力開発を促進', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html', 1),
('働き方改革推進支援助成金', '働き方改革', '厚生労働省', 2500000, '労働時間の短縮や年次有給休暇の取得促進に取り組む中小企業事業主', '就業規則、勤怠管理記録、労働時間等設定改善計画', '労働時間の改善を推進する中小企業事業主を支援', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000120692.html', 1);

-- タスクテンプレート（よく使うタスク）
INSERT OR IGNORE INTO task_templates (name, description, default_priority, default_estimated_hours, category) VALUES
('給与計算', '月次の給与計算業務', 'high', 4, '定期業務'),
('社会保険手続き', '社会保険の各種手続き', 'high', 2, '定期業務'),
('労働保険年度更新', '労働保険の年度更新手続き', 'urgent', 8, '年次業務'),
('算定基礎届', '社会保険の算定基礎届の作成・提出', 'high', 6, '年次業務'),
('年末調整', '年末調整関連業務', 'urgent', 10, '年次業務'),
('雇用契約書作成', '新規雇用時の契約書作成', 'medium', 1, '不定期業務'),
('就業規則改定', '就業規則の見直しと改定', 'medium', 5, '不定期業務'),
('労基署対応', '労働基準監督署への対応', 'urgent', 3, '不定期業務');

-- 通知テンプレート
INSERT OR IGNORE INTO email_templates (name, subject, body, template_type) VALUES
('deadline_reminder', '【リマインド】タスクの期限が近づいています', '{{user_name}}様\n\n以下のタスクの期限が近づいています。\n\nタスク名: {{task_name}}\n期限: {{due_date}}\n顧客: {{client_name}}\n\n早めの対応をお願いします。', 'reminder'),
('task_completed', 'タスク完了通知', '{{user_name}}様\n\n以下のタスクが完了しました。\n\nタスク名: {{task_name}}\n完了日: {{completed_date}}\n担当者: {{assignee_name}}\n\nお疲れ様でした。', 'notification'),
('monthly_report', '月次レポート', '{{user_name}}様\n\n{{month}}月の業務レポートをお送りします。\n\n完了タスク数: {{completed_count}}\n進行中タスク数: {{in_progress_count}}\n今後の予定タスク数: {{pending_count}}\n\n詳細はシステムにログインしてご確認ください。', 'report');

-- カレンダー設定のデフォルト値
INSERT OR IGNORE INTO calendar_settings (user_id, sync_enabled, calendar_id, notification_minutes) VALUES
(1, 0, NULL, 30);