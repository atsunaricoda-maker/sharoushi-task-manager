-- サンプル助成金データを挿入
INSERT OR IGNORE INTO subsidies (name, category, managing_organization, max_amount, application_end_date, requirements, required_documents, description, url, is_active) VALUES 
('雇用調整助成金', '雇用維持', '厚生労働省', 15000, '2025-03-31', '経済上の理由により事業活動の縮小を余儀なくされた事業主', '事業計画書、雇用調整実施計画届', '労働者の雇用維持を図る事業主に対して、休業手当等の一部を助成', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07.html', 1),
('キャリアアップ助成金', '人材育成', '厚生労働省', 720000, '2025-03-31', '有期雇用労働者、短時間労働者、派遣労働者を企業内でキャリアアップさせた事業主', '労働者名簿、賃金台帳、雇用契約書', '非正規雇用労働者の企業内でのキャリアアップを促進するため、正社員化、処遇改善の取組を実施した事業主に対して助成', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html', 1),
('IT導入補助金', 'DX推進', '経済産業省', 4500000, '2025-02-28', 'ITツールを導入する中小企業・小規模事業者', 'IT導入計画書、見積書、事業計画書', '中小企業・小規模事業者等が自社の課題やニーズに合ったITツールを導入する経費の一部を補助', 'https://www.it-hojo.jp/', 1),
('両立支援等助成金', '働き方改革', '厚生労働省', 600000, '2025-03-31', '仕事と家庭の両立支援に取り組む事業主', '就業規則、育児休業取得者の証明書類', '職業生活と家庭生活が両立できる職場環境づくりに取り組む事業主を支援', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kodomo/shokuba_kosodate/ryouritsu01/', 1),
('人材開発支援助成金', '人材育成', '厚生労働省', 3000000, '2025-03-31', '職業訓練等を実施する事業主', '訓練計画書、訓練実施報告書、賃金台帳', '労働者の職業生活設計の全期間を通じて段階的かつ体系的な職業能力開発を促進', 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/d01-1.html', 1);

-- 既存クライアントがいない場合はサンプルクライアントも追加
INSERT OR IGNORE INTO clients (id, company_name, company_name_kana, employee_count, postal_code, address, phone, email, contact_person, contract_type, contract_start_date, billing_day) VALUES 
(1, '株式会社サンプル商事', 'カブシキガイシャサンプルショウジ', 50, '100-0001', '東京都千代田区千代田1-1-1', '03-1234-5678', 'info@sample.co.jp', '田中太郎', 'monthly', '2024-01-01', 20),
(2, '有限会社テスト工業', 'ユウゲンガイシャテストコウギョウ', 30, '530-0001', '大阪府大阪市北区梅田1-1-1', '06-1234-5678', 'contact@test.co.jp', '山田花子', 'monthly', '2024-02-01', 25);

-- 既存ユーザーがいない場合はサンプルユーザーも追加
INSERT OR IGNORE INTO users (id, email, name, role) VALUES 
(1, 'admin@example.com', '管理者', 'admin'),
(2, 'staff1@example.com', 'スタッフ1', 'member');