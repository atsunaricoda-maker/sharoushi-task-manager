-- テスト用社労士データ
INSERT OR IGNORE INTO users (email, name, role) VALUES 
  ('tanaka@sharoushi.com', '田中 太郎', 'admin'),
  ('suzuki@sharoushi.com', '鈴木 花子', 'sharoushi'),
  ('sato@sharoushi.com', '佐藤 次郎', 'sharoushi'),
  ('yamada@sharoushi.com', '山田 三郎', 'sharoushi'),
  ('ito@sharoushi.com', '伊藤 美咲', 'sharoushi'),
  ('watanabe@sharoushi.com', '渡辺 健一', 'sharoushi'),
  ('takahashi@sharoushi.com', '高橋 由美', 'sharoushi');

-- テスト用顧問先データ
INSERT OR IGNORE INTO clients (name, name_kana, address, contact_email, contact_phone, employee_count, health_insurance_type, contract_plan, primary_contact_name, monthly_fee) VALUES 
  ('株式会社ABC商事', 'カブシキガイシャエービーシーショウジ', '東京都千代田区丸の内1-1-1', 'info@abc.co.jp', '03-1234-5678', 50, '協会けんぽ', 'スタンダードプラン', '営業部 山田様', 50000),
  ('有限会社XYZ工業', 'ユウゲンガイシャエックスワイゼットコウギョウ', '東京都品川区品川1-2-3', 'contact@xyz.co.jp', '03-2345-6789', 30, '協会けんぽ', 'ライトプラン', '総務部 田中様', 30000),
  ('株式会社テクノロジー', 'カブシキガイシャテクノロジー', '東京都渋谷区渋谷2-3-4', 'hr@technology.co.jp', '03-3456-7890', 100, '健保組合', 'プレミアムプラン', '人事部 鈴木様', 80000),
  ('合同会社イノベーション', 'ゴウドウガイシャイノベーション', '東京都新宿区新宿3-4-5', 'admin@innovation.co.jp', '03-4567-8901', 20, '協会けんぽ', 'ライトプラン', '経理部 佐藤様', 25000),
  ('株式会社グローバル', 'カブシキガイシャグローバル', '東京都港区赤坂4-5-6', 'global@global.co.jp', '03-5678-9012', 150, '健保組合', 'プレミアムプラン', '人事部 伊藤様', 100000);

-- 定期業務テンプレート
INSERT OR IGNORE INTO task_templates (name, description, task_type, frequency, target_month, estimated_hours, priority) VALUES 
  ('給与計算', '毎月の給与計算業務', 'regular', 'monthly', NULL, 3.0, 'high'),
  ('社会保険料算定', '社会保険料の算定と申告', 'regular', 'monthly', NULL, 2.0, 'high'),
  ('労働保険料申告', '年度更新時の労働保険料申告', 'regular', 'yearly', 6, 5.0, 'high'),
  ('算定基礎届', '年次の算定基礎届提出', 'regular', 'yearly', 7, 4.0, 'high'),
  ('賞与支払届', '賞与支払い時の届出', 'irregular', NULL, NULL, 1.5, 'medium'),
  ('入社手続き', '新入社員の社会保険加入手続き', 'irregular', NULL, NULL, 2.0, 'high'),
  ('退職手続き', '退職者の社会保険脱退手続き', 'irregular', NULL, NULL, 2.0, 'high'),
  ('育児休業申請', '育児休業給付金の申請手続き', 'irregular', NULL, NULL, 3.0, 'medium');

-- 顧問先-テンプレート関連（各顧問先に基本的な定期業務を割り当て）
INSERT OR IGNORE INTO client_task_templates (client_id, template_id, is_active, custom_due_day, assigned_user_id) VALUES 
  (1, 1, TRUE, 25, 2), -- ABC商事の給与計算を鈴木さんが担当
  (1, 2, TRUE, 25, 2), -- ABC商事の社保算定も鈴木さんが担当
  (2, 1, TRUE, 20, 3), -- XYZ工業の給与計算を佐藤さんが担当
  (2, 2, TRUE, 20, 3), -- XYZ工業の社保算定も佐藤さんが担当
  (3, 1, TRUE, 25, 4), -- テクノロジー社の給与計算を山田さんが担当
  (3, 2, TRUE, 25, 4), -- テクノロジー社の社保算定も山田さんが担当
  (4, 1, TRUE, 20, 5), -- イノベーション社の給与計算を伊藤さんが担当
  (4, 2, TRUE, 20, 5), -- イノベーション社の社保算定も伊藤さんが担当
  (5, 1, TRUE, 25, 6), -- グローバル社の給与計算を渡辺さんが担当
  (5, 2, TRUE, 25, 6); -- グローバル社の社保算定も渡辺さんが担当

-- テスト用タスクデータ（現在進行中のタスク）
INSERT OR IGNORE INTO tasks (title, description, client_id, assignee_id, task_type, status, priority, due_date, estimated_hours, progress) VALUES 
  ('1月分給与計算', '株式会社ABC商事の1月分給与計算', 1, 2, 'regular', 'in_progress', 'high', date('now', '+5 days'), 3.0, 50),
  ('1月分社会保険料算定', '株式会社ABC商事の1月分社会保険料算定', 1, 2, 'regular', 'pending', 'high', date('now', '+5 days'), 2.0, 0),
  ('新入社員入社手続き', '株式会社テクノロジーの新入社員3名の入社手続き', 3, 4, 'irregular', 'in_progress', 'urgent', date('now', '+2 days'), 6.0, 30),
  ('退職者手続き', '有限会社XYZ工業の退職者1名の手続き', 2, 3, 'irregular', 'pending', 'medium', date('now', '+7 days'), 2.0, 0),
  ('育児休業申請', '株式会社グローバルの育児休業申請手続き', 5, 6, 'irregular', 'pending', 'medium', date('now', '+10 days'), 3.0, 0),
  ('12月分給与計算（完了済み）', '株式会社ABC商事の12月分給与計算', 1, 2, 'regular', 'completed', 'high', date('now', '-5 days'), 3.0, 100),
  ('労働保険料更新準備', '全顧問先の労働保険料更新準備', 1, 1, 'regular', 'pending', 'high', date('now', '+30 days'), 10.0, 0);