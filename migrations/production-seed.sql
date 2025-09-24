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
INSERT OR IGNORE INTO task_templates (name, description, priority, estimated_hours) VALUES
('給与計算', '月次の給与計算業務', 'high', 4),
('社会保険手続き', '社会保険の各種手続き', 'high', 2),
('労働保険年度更新', '労働保険の年度更新手続き', 'urgent', 8),
('算定基礎届', '社会保険の算定基礎届の作成・提出', 'high', 6),
('年末調整', '年末調整関連業務', 'urgent', 10),
('雇用契約書作成', '新規雇用時の契約書作成', 'medium', 1),
('就業規則改定', '就業規則の見直しと改定', 'medium', 5),
('労基署対応', '労働基準監督署への対応', 'urgent', 3);

-- 通知テンプレートとカレンダー設定は後で追加