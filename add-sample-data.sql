-- Add sample tasks for testing reports (using existing client_id=1 and user_id=1)
INSERT INTO tasks (title, description, client_id, assignee_id, status, priority, due_date, created_at, completed_at, estimated_hours, actual_hours) 
VALUES 
  ('月次給与計算', '1月分の給与計算業務', 1, 1, 'completed', 'high', date('now', '+2 days'), datetime('now', '-5 days'), datetime('now', '-1 day'), 8, 7),
  ('社会保険手続き', '新入社員の社会保険加入手続き', 1, 1, 'completed', 'urgent', date('now', '+1 day'), datetime('now', '-7 days'), datetime('now', '-2 days'), 4, 5),
  ('労務相談対応', '労働時間に関する相談', 1, 1, 'in_progress', 'medium', date('now', '+3 days'), datetime('now', '-3 days'), NULL, 3, 1),
  ('助成金申請書作成', '雇用調整助成金の申請書作成', 1, 1, 'pending', 'high', date('now', '+7 days'), datetime('now', '-2 days'), NULL, 10, NULL),
  ('就業規則改定', '就業規則の見直しと改定案作成', 1, 1, 'completed', 'medium', date('now', '+10 days'), datetime('now', '-10 days'), datetime('now', '-3 days'), 16, 18),
  ('労働保険年度更新', '労働保険料の年度更新手続き', 1, 1, 'in_progress', 'high', date('now', '+5 days'), datetime('now', '-4 days'), NULL, 6, 3),
  ('健康診断実施計画', '定期健康診断の計画と実施', 1, 1, 'pending', 'low', date('now', '+14 days'), datetime('now', '-1 day'), NULL, 4, NULL),
  ('育児休業申請', '育児休業給付金の申請手続き', 1, 1, 'completed', 'urgent', date('now'), datetime('now', '-8 days'), datetime('now', '-4 days'), 3, 3);