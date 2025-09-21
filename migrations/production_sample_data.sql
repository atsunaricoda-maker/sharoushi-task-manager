-- Sample data for production database
-- This includes essential sample data for testing the subsidy functionality

-- サンプルユーザー
INSERT OR IGNORE INTO users (id, email, name, role) VALUES
(1, 'admin@sharoushi.com', '管理者', 'admin'),
(2, 'tanaka@sharoushi.com', '田中太郎', 'sharoushi');

-- サンプル顧問先
INSERT OR IGNORE INTO clients (id, name, name_kana, employee_count, contract_plan) VALUES
(1, '株式会社テスト', 'カブシキガイシャテスト', 50, 'standard'),
(2, 'サンプル商事株式会社', 'サンプルショウジカブシキガイシャ', 30, 'basic');

-- サンプル助成金マスターデータ
INSERT OR IGNORE INTO subsidies (id, name, category, managing_organization, description, max_amount, subsidy_rate, application_period_type, is_active) VALUES
(1, '雇用調整助成金', '雇用系', '厚生労働省', '経済上の理由により事業活動の縮小を余儀なくされた事業主が、労働者に対して一時的に休業、教育訓練又は出向を行い、労働者の雇用維持を図った場合に、休業手当、賃金等の一部を助成します。', 15000, 80.0, 'anytime', 1),
(2, 'キャリアアップ助成金', '育成系', '厚生労働省', '有期雇用労働者、短時間労働者、派遣労働者といったいわゆる非正規雇用の労働者の企業内でのキャリアアップを促進するため、正社員化、処遇改善の取組を実施した事業主に対して助成金を支給します。', 570000, 100.0, 'anytime', 1),
(3, '人材確保等支援助成金', '雇用系', '厚生労働省', '雇用管理制度の導入等による離職率の低下、生産性の向上を通じて、人材の確保・定着を図る事業主に対して助成します。', 720000, 75.0, 'anytime', 1);

-- サンプル助成金申請
INSERT OR IGNORE INTO subsidy_applications (id, subsidy_id, client_id, status, amount_requested, submission_deadline, notes, created_by) VALUES
(1, 1, 1, 'planning', 500000, '2024-03-31', '雇用調整助成金の申請準備中', 1),
(2, 2, 2, 'preparing', 570000, '2024-04-15', 'キャリアアップ助成金の書類準備中', 2);