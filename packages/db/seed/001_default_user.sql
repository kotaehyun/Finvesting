-- 단일 사용자 모드 기본 사용자 (.env DEFAULT_USER_ID와 일치)
INSERT INTO users (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'me')
ON CONFLICT (id) DO NOTHING;

INSERT INTO financial_profiles (user_id, monthly_net_income, monthly_fixed_cost, emergency_fund_months, risk_tolerance)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, NULL, 6, 'moderate')
ON CONFLICT (user_id) DO NOTHING;
