-- 更新された助成金サンプルデータ（新スキーマ対応）
-- 既存データをクリア（開発環境のみ）
-- DELETE FROM subsidy_templates;
-- DELETE FROM subsidy_applications;
-- DELETE FROM subsidies;

-- サンプル助成金マスターデータを挿入
INSERT OR IGNORE INTO subsidies (
    id, name, category, managing_organization, description, 
    max_amount, subsidy_rate, requirements, required_documents,
    application_period_type, application_start_date, application_end_date,
    url, is_active, created_at, updated_at
) VALUES 
(1, '雇用調整助成金', '雇用系', '厚生労働省', 
 '経済上の理由により事業活動の縮小を余儀なくされた事業主が、労働者に対して一時的に休業、教育訓練又は出向を行い、労働者の雇用維持を図った場合に、休業手当、賃金等の一部を助成する制度',
 15000, 66.7, 
 '経済上の理由により事業活動の縮小を余儀なくされた事業主
労働者に対して一時的に休業等を行う
雇用保険適用事業所の事業主であること',
 '雇用調整実施計画（変更）届
支給申請書
休業・教育訓練実績一覧表
労働者名簿
賃金台帳',
 'anytime', NULL, '2025-03-31', 
 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07.html', 
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(2, 'キャリアアップ助成金', '育成・研修系', '厚生労働省',
 '有期雇用労働者、短時間労働者、派遣労働者といった、非正規雇用労働者の企業内でのキャリアアップを促進するため、正社員化、処遇改善の取組を実施した事業主に対して助成する制度',
 720000, NULL,
 '雇用保険適用事業所の事業主であること
キャリアアップ管理者を置いていること
キャリアアップ計画を策定し、管轄労働局長の受給資格の認定を受けた事業主であること',
 'キャリアアップ計画書
正社員化コースまたは処遇改善コースの支給申請書
労働条件通知書または雇用契約書
賃金台帳
労働者名簿',
 'anytime', NULL, '2025-03-31',
 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html',
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(3, 'IT導入補助金', 'IT・デジタル系', '経済産業省',
 'IT導入補助金は、中小企業・小規模事業者等が自社の課題やニーズに合ったITツールを導入する経費の一部を補助することで、業務効率化・売上アップをサポートする制度',
 4500000, 50.0,
 '中小企業・小規模事業者等であること
IT導入支援事業者から購入するITツールであること
導入するITツールがIT導入補助金事務局に登録されているものであること',
 'IT導入計画書
事業計画書
決算書・確定申告書
履歴事項全部証明書
見積書',
 'periodic', '2024-03-01', '2025-02-28',
 'https://www.it-hojo.jp/',
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(4, '両立支援等助成金', '福利厚生系', '厚生労働省',
 '職業生活と家庭生活が両立できる"職場環境づくり"に取り組む事業主を支援する助成金で、育児・介護休業法に基づく制度の円滑な利用促進を図る制度',
 600000, NULL,
 '雇用保険適用事業所の事業主であること
次世代育成支援対策推進法に基づく一般事業主行動計画を策定し、労働局に届け出ていること
男性の育児休業取得を促進する取り組みを行っていること',
 '支給申請書
次世代育成支援対策推進法に基づく一般事業主行動計画
育児休業取得者の育児休業申出書
就業規則',
 'anytime', NULL, '2025-03-31',
 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/shokuba_kosodate/ryouritsu01/',
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(5, '人材開発支援助成金', '育成・研修系', '厚生労働省',
 '労働者の職業生活設計の全期間を通じて段階的かつ体系的な職業能力開発を促進するため、職業訓練などを実施する事業主に対して訓練経費や訓練期間中の賃金の一部を助成する制度',
 3000000, 45.0,
 '雇用保険適用事業所の事業主であること
職業能力開発推進者を選任していること
事業内職業能力開発計画を策定していること',
 '職業能力開発推進者選任届
事業内職業能力開発計画
訓練計画届
支給申請書
賃金台帳',
 'anytime', NULL, '2025-03-31',
 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html',
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

(6, '働き方改革推進支援助成金', '働き方改革系', '厚生労働省',
 '中小企業事業主が、労働時間の短縮や年次有給休暇の促進に向けた環境整備に取り組む際に、その実施に要した費用の一部を助成する制度',
 1000000, 75.0,
 '労働者災害補償保険の適用事業主であること
36協定を締結・届出を行っていること
年5日の年次有給休暇の取得に向けて就業規則等を整備していること',
 '支給申請書
勤怠管理システム等の導入費用
就業規則
36協定
労働時間等設定改善計画書',
 'fixed', '2024-04-01', '2025-01-31',
 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/jikan/syokubaisikitelabour.html',
 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- サンプル助成金テンプレートデータ（新スキーマ対応）
INSERT OR IGNORE INTO subsidy_templates (
    id, subsidy_id, name, checklist_items, document_list, 
    timeline_template, tips, created_by, is_public, created_at
) VALUES 
(1, 1, '雇用調整助成金 標準テンプレート',
 '[
   {"name": "労使協定の締結", "category": "要件確認", "required": true},
   {"name": "休業実施計画の作成", "category": "書類準備", "required": true},
   {"name": "計画届の提出", "category": "申請手続き", "required": true},
   {"name": "休業手当の支払い", "category": "実施", "required": true},
   {"name": "支給申請書の提出", "category": "申請手続き", "required": true}
 ]',
 '[
   {"name": "雇用調整実施計画（変更）届", "type": "申請書", "required": true},
   {"name": "休業・教育訓練実績一覧表", "type": "実績報告", "required": true},
   {"name": "労働者名簿", "type": "証明書類", "required": true},
   {"name": "賃金台帳", "type": "証明書類", "required": true}
 ]',
 '[
   {"phase": "準備期間", "duration": "1週間", "tasks": ["労使協定締結", "計画書作成"]},
   {"phase": "申請期間", "duration": "1週間", "tasks": ["計画届提出", "受理確認"]},
   {"phase": "実施期間", "duration": "実施期間中", "tasks": ["休業実施", "休業手当支払"]},
   {"phase": "申請期間", "duration": "2ヶ月以内", "tasks": ["支給申請", "実績報告"]}
 ]',
 '事前に労働組合または労働者代表との協定が必要です。休業手当は平均賃金の60%以上を支払う必要があります。',
 1, 1, CURRENT_TIMESTAMP),

(2, 2, 'キャリアアップ助成金 正社員化コース',
 '[
   {"name": "キャリアアップ計画の策定", "category": "計画準備", "required": true},
   {"name": "キャリアアップ計画の提出・受理", "category": "申請手続き", "required": true},
   {"name": "正社員転換制度の規定整備", "category": "制度整備", "required": true},
   {"name": "対象労働者の転換実施", "category": "実施", "required": true},
   {"name": "転換後6ヶ月経過確認", "category": "確認", "required": true},
   {"name": "支給申請書の提出", "category": "申請手続き", "required": true}
 ]',
 '[
   {"name": "キャリアアップ計画書", "type": "計画書", "required": true},
   {"name": "正社員転換制度に係る労働協約または就業規則", "type": "規則", "required": true},
   {"name": "対象労働者の労働条件通知書", "type": "証明書類", "required": true},
   {"name": "賃金台帳", "type": "証明書類", "required": true}
 ]',
 '[
   {"phase": "計画策定", "duration": "2週間", "tasks": ["キャリアアップ管理者選任", "計画書作成"]},
   {"phase": "申請準備", "duration": "1週間", "tasks": ["計画書提出", "受理確認"]},
   {"phase": "制度整備", "duration": "1ヶ月", "tasks": ["就業規則改定", "転換制度整備"]},
   {"phase": "実施期間", "duration": "6ヶ月以上", "tasks": ["正社員転換", "処遇改善"]},
   {"phase": "申請期間", "duration": "2ヶ月以内", "tasks": ["支給申請", "必要書類提出"]}
 ]',
 'キャリアアップ計画は転換実施前に提出・受理されている必要があります。転換後6ヶ月の賃金を転換前6ヶ月と比較して3%以上増額する必要があります。',
 1, 1, CURRENT_TIMESTAMP),

(3, 3, 'IT導入補助金 通常枠テンプレート',
 '[
   {"name": "IT導入支援事業者の選定", "category": "準備", "required": true},
   {"name": "導入ITツールの選定", "category": "準備", "required": true},
   {"name": "交付申請書の作成・提出", "category": "申請手続き", "required": true},
   {"name": "交付決定通知の受領", "category": "確認", "required": true},
   {"name": "ITツールの発注・契約・導入", "category": "実施", "required": true},
   {"name": "事業実施効果報告の提出", "category": "報告", "required": true}
 ]',
 '[
   {"name": "IT導入計画書", "type": "計画書", "required": true},
   {"name": "事業計画書", "type": "計画書", "required": true},
   {"name": "履歴事項全部証明書", "type": "証明書類", "required": true},
   {"name": "決算書または確定申告書", "type": "財務書類", "required": true}
 ]',
 '[
   {"phase": "準備期間", "duration": "2週間", "tasks": ["支援事業者選定", "ITツール選定"]},
   {"phase": "申請期間", "duration": "1週間", "tasks": ["申請書作成", "必要書類準備", "申請提出"]},
   {"phase": "審査期間", "duration": "1ヶ月", "tasks": ["交付決定待ち"]},
   {"phase": "実施期間", "duration": "6ヶ月以内", "tasks": ["ITツール導入", "従業員研修"]},
   {"phase": "報告期間", "duration": "1ヶ月以内", "tasks": ["効果測定", "実績報告書作成・提出"]}
 ]',
 'IT導入支援事業者による申請サポートを活用しましょう。補助対象経費は交付決定後に契約・発注したもののみです。',
 1, 1, CURRENT_TIMESTAMP);

-- 既存クライアントがいない場合はサンプルクライアントも追加
INSERT OR IGNORE INTO clients (
    id, name, name_kana, address, contact_email, contact_phone, 
    employee_count, contract_plan, primary_contact_name, monthly_fee,
    contract_start_date, created_at, updated_at
) VALUES 
(1, '株式会社サンプル商事', 'カブシキガイシャサンプルショウジ', 
 '東京都千代田区千代田1-1-1', 'info@sample.co.jp', '03-1234-5678',
 50, 'standard', '田中太郎', 50000.00,
 '2024-01-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 
(2, '有限会社テスト工業', 'ユウゲンガイシャテストコウギョウ',
 '大阪府大阪市北区梅田1-1-1', 'contact@test.co.jp', '06-1234-5678', 
 30, 'standard', '山田花子', 40000.00,
 '2024-02-01', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 既存ユーザーがいない場合はサンプルユーザーも追加
INSERT OR IGNORE INTO users (id, email, name, role, created_at, updated_at) VALUES 
(1, 'admin@example.com', '管理者', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'staff1@example.com', 'スタッフ1', 'member', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- サンプル申請データ（デモ用）
INSERT OR IGNORE INTO subsidy_applications (
    id, subsidy_id, client_id, status, application_date,
    amount_requested, submission_deadline, notes, created_by,
    created_at, updated_at
) VALUES 
(1, 1, 1, 'preparing', '2024-09-01', 500000, '2024-12-31', 
 '年末の需要減少に伴う雇用調整のため申請予定', 1,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 
(2, 2, 2, 'submitted', '2024-08-15', 720000, '2024-11-30',
 '非正規職員の正社員化促進のため申請', 1,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
 
(3, 3, 1, 'planning', NULL, 2000000, '2025-02-28',
 '業務効率化のためのITシステム導入検討中', 1,
 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- サンプルチェックリストデータ
INSERT OR IGNORE INTO subsidy_checklists (
    application_id, item_name, category, is_required, is_completed,
    display_order, created_at
) VALUES 
-- 雇用調整助成金のチェックリスト
(1, '労使協定の締結', '要件確認', 1, 1, 1, CURRENT_TIMESTAMP),
(1, '休業実施計画の作成', '書類準備', 1, 1, 2, CURRENT_TIMESTAMP),
(1, '計画届の提出', '申請手続き', 1, 0, 3, CURRENT_TIMESTAMP),
(1, '休業手当の支払い', '実施', 1, 0, 4, CURRENT_TIMESTAMP),

-- キャリアアップ助成金のチェックリスト
(2, 'キャリアアップ計画の策定', '計画準備', 1, 1, 1, CURRENT_TIMESTAMP),
(2, 'キャリアアップ計画の提出・受理', '申請手続き', 1, 1, 2, CURRENT_TIMESTAMP),
(2, '正社員転換制度の規定整備', '制度整備', 1, 1, 3, CURRENT_TIMESTAMP),
(2, '対象労働者の転換実施', '実施', 1, 1, 4, CURRENT_TIMESTAMP),
(2, '転換後6ヶ月経過確認', '確認', 1, 0, 5, CURRENT_TIMESTAMP),

-- IT導入補助金のチェックリスト
(3, 'IT導入支援事業者の選定', '準備', 1, 0, 1, CURRENT_TIMESTAMP),
(3, '導入ITツールの選定', '準備', 1, 0, 2, CURRENT_TIMESTAMP),
(3, '交付申請書の作成・提出', '申請手続き', 1, 0, 3, CURRENT_TIMESTAMP);