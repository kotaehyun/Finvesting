-- ==============================================================================
-- 002_sample_profile.sql
-- 단일 사용자 기본 재무 프로필 및 전체 패널 샘플 데이터 시드
-- (기본정보, 급여공제, 고정비, 월별 세액/급여, 적금/예금, 보험, 계좌, 거래내역, 투자내역)
-- ==============================================================================

-- 1. 기본 사용자 확인
INSERT INTO users (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'me')
ON CONFLICT (id) DO NOTHING;

-- 2. 재무 프로필 (financial_profiles)
INSERT INTO financial_profiles (
  user_id,
  monthly_gross_income,
  monthly_net_income,
  monthly_income_tax,
  monthly_health_insurance,
  monthly_fixed_cost,
  emergency_fund_months,
  risk_tolerance,
  target_allocation,
  pay_earnings,
  invest_style
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  5000000,
  4290000,
  250000,
  185000,
  1208900,
  6,
  'moderate',
  '{"cash": 0.15, "deposit": 0.25, "stock": 0.50, "crypto": 0.10}'::jsonb,
  '[
    {"name": "기본급", "amount": 4200000},
    {"name": "식대", "amount": 200000},
    {"name": "차량유지비", "amount": 200000},
    {"name": "직책수당", "amount": 400000}
  ]'::jsonb,
  '{"horizon": "medium", "experience": "experienced", "lossOk": "moderate", "goal": "growth"}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  monthly_gross_income = EXCLUDED.monthly_gross_income,
  monthly_net_income = EXCLUDED.monthly_net_income,
  monthly_income_tax = EXCLUDED.monthly_income_tax,
  monthly_health_insurance = EXCLUDED.monthly_health_insurance,
  monthly_fixed_cost = EXCLUDED.monthly_fixed_cost,
  emergency_fund_months = EXCLUDED.emergency_fund_months,
  risk_tolerance = EXCLUDED.risk_tolerance,
  target_allocation = EXCLUDED.target_allocation,
  pay_earnings = EXCLUDED.pay_earnings,
  invest_style = EXCLUDED.invest_style,
  updated_at = NOW();

-- 3. 매달 나가는 고정비 (recurring_costs)
INSERT INTO recurring_costs (id, user_id, name, category, amount, day_of_month, memo, is_active)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '오피스텔 월세', 'housing', 650000, 25, '매달 25일 자동이체', true),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '관리비/공과금', 'utilities', 180000, 20, '관리비 및 가스·전기요금', true),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'SKT 5G 요금제', 'phone', 75000, 15, '5G 데이터 무제한 요금제', true),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '넷플릭스 프리미엄', 'subscription', 17000, 1, '4K 4인 멤버십 구독', true),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '유튜브 프리미엄', 'subscription', 14900, 5, '유튜브 뮤직 포함 구독', true),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '실비 및 종합건강보험', 'insurance', 122000, 10, '보장성 종합보험', true),
  ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '청년 전세대출 이자', 'loan_repayment', 150000, 22, '버팀목 전세대출 이자', true)
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  day_of_month = EXCLUDED.day_of_month,
  memo = EXCLUDED.memo,
  is_active = EXCLUDED.is_active;

-- 4. 근로소득세 월별 추이 (income_tax_months)
INSERT INTO income_tax_months (user_id, month, amount)
VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-05', 245000),
  ('00000000-0000-0000-0000-000000000001', '2026-06', 245000),
  ('00000000-0000-0000-0000-000000000001', '2026-07', 380000),
  ('00000000-0000-0000-0000-000000000001', '2026-08', 250000),
  ('00000000-0000-0000-0000-000000000001', '2026-09', 250000),
  ('00000000-0000-0000-0000-000000000001', '2026-10', 250000)
ON CONFLICT (user_id, month) DO UPDATE SET
  amount = EXCLUDED.amount;

-- 5. 월별 급여 스냅샷 (payroll_months)
INSERT INTO payroll_months (
  user_id, month, base_amount, allowance_amount, bonus_amount, other_amount,
  gross_amount, tax_amount, insurance_amount, net_amount, earnings
)
VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-05', 4200000, 800000, 0, 0, 5000000, 245000, 455000, 4300000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "차량유지비", "amount": 200000}, {"name": "직책수당", "amount": 400000}]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '2026-06', 4200000, 800000, 0, 0, 5000000, 245000, 455000, 4300000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "차량유지비", "amount": 200000}, {"name": "직책수당", "amount": 400000}]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '2026-07', 4200000, 800000, 1500000, 0, 6500000, 380000, 520000, 5600000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "상반기 성과급", "amount": 1500000}, {"name": "직책수당", "amount": 400000}]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '2026-08', 4200000, 800000, 0, 0, 5000000, 250000, 460000, 4290000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "차량유지비", "amount": 200000}, {"name": "직책수당", "amount": 400000}]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '2026-09', 4200000, 800000, 0, 0, 5000000, 250000, 460000, 4290000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "차량유지비", "amount": 200000}, {"name": "직책수당", "amount": 400000}]'::jsonb),
  ('00000000-0000-0000-0000-000000000001', '2026-10', 4200000, 800000, 0, 0, 5000000, 250000, 460000, 4290000, '[{"name": "기본급", "amount": 4200000}, {"name": "식대", "amount": 200000}, {"name": "차량유지비", "amount": 200000}, {"name": "직책수당", "amount": 400000}]'::jsonb)
ON CONFLICT (user_id, month) DO UPDATE SET
  base_amount = EXCLUDED.base_amount,
  allowance_amount = EXCLUDED.allowance_amount,
  bonus_amount = EXCLUDED.bonus_amount,
  gross_amount = EXCLUDED.gross_amount,
  tax_amount = EXCLUDED.tax_amount,
  insurance_amount = EXCLUDED.insurance_amount,
  net_amount = EXCLUDED.net_amount,
  earnings = EXCLUDED.earnings;

-- 6. 계좌 (accounts)
INSERT INTO accounts (id, user_id, name, institution, type, currency, balance, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'KB국민 ONE통장', 'KB국민은행', 'checking', 'KRW', 4250000, true),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '토스 파킹통장', '토스뱅크', 'savings', 'KRW', 12500000, true),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '키움증권 위탁계좌', '키움증권', 'brokerage', 'KRW', 6800000, true)
ON CONFLICT (id) DO UPDATE SET
  balance = EXCLUDED.balance,
  is_active = EXCLUDED.is_active;

-- 7. 적금 및 예금 상품 (savings_plans) & 월별 납입 (savings_contributions)
INSERT INTO savings_plans (
  id, user_id, account_id, name, institution, kind, interest_rate, compounding,
  term_months, monthly_amount, start_month, maturity_month, description
)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'KB 청년도약계좌', 'KB국민은행', 'installment', 6.0000, 'simple', 60, 700000, '2024-01', '2029-01', '정부기여금 매칭 청년 중장기 자산형성 적금'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '카카오뱅크 26주적금', '카카오뱅크', 'installment', 3.8000, 'simple', 6, 300000, '2026-05', '2026-11', '소액 단기 목돈 마련용 자유적금'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', '토스 먼저 이자받는 예금', '토스뱅크', 'savings', 3.5000, 'simple', 12, 10000000, '2026-03', '2027-03', '비상금 여유자금 1년 만기 정기예금')
ON CONFLICT (id) DO UPDATE SET
  interest_rate = EXCLUDED.interest_rate,
  monthly_amount = EXCLUDED.monthly_amount;

-- 적금 납입 내역 (최근 6개월)
INSERT INTO savings_contributions (plan_id, user_id, month, amount, memo)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-05', 700000, '5회차 자동이체'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-06', 700000, '6회차 자동이체'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-07', 700000, '7회차 자동이체'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-08', 700000, '8회차 자동이체'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-09', 700000, '9회차 자동이체'),
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2026-10', 700000, '10회차 자동이체'),

  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-05', 300000, '1회차 납입'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-06', 300000, '2회차 납입'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-07', 300000, '3회차 납입'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-08', 300000, '4회차 납입'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-09', 300000, '5회차 납입'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2026-10', 300000, '6회차 납입'),

  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-03', 10000000, '원금 일시 예치')
ON CONFLICT (plan_id, month) DO UPDATE SET
  amount = EXCLUDED.amount,
  memo = EXCLUDED.memo;

-- 8. 보험 증권 (insurance_policies)
INSERT INTO insurance_policies (
  id, user_id, name, insurer, kind, monthly_premium, death_amount,
  medical_covered, cancer_amount, brain_amount, heart_amount,
  accident_amount, disability_amount, start_month, end_month, memo
)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'KB 3대질병 종합건강보험',
    'KB손해보험',
    'health',
    58000,
    0,
    false,
    50000000,
    30000000,
    30000000,
    20000000,
    10000000,
    '2022-03',
    '2042-03',
    '암·뇌혈관·허혈성심장질환 3대 진단비 종합'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '삼성화재 실손의료비보험',
    '삼성화재',
    'health',
    32000,
    0,
    true,
    0,
    0,
    0,
    0,
    0,
    '2021-06',
    '2031-06',
    '4세대 단독 실손의료보험 (급여 80%, 비급여 70%)'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'DB손해보험 참좋은 운전자보험',
    'DB손해보험',
    'accident',
    18000,
    0,
    false,
    0,
    0,
    0,
    100000000,
    0,
    '2023-01',
    '2033-01',
    '교통사고 처리지원금 및 변호사 선임비용'
  )
ON CONFLICT (id) DO UPDATE SET
  monthly_premium = EXCLUDED.monthly_premium,
  memo = EXCLUDED.memo;

-- 9. 종목 마스터 (instruments), 시세 (market_quotes), 체결 원장 (trades)
INSERT INTO instruments (id, symbol, market, name, asset_class, currency)
VALUES
  ('e0000000-0000-0000-0000-000000000001', '005930', 'KRX', '삼성전자', 'stock', 'KRW'),
  ('e0000000-0000-0000-0000-000000000002', '360750', 'KRX', 'TIGER 미국S&P500', 'etf', 'KRW'),
  ('e0000000-0000-0000-0000-000000000003', 'AAPL', 'NASDAQ', 'Apple Inc.', 'stock', 'USD')
ON CONFLICT (symbol, market) DO UPDATE SET
  name = EXCLUDED.name;

-- 시세
INSERT INTO market_quotes (instrument_id, date, open, high, low, close, volume, source)
VALUES
  ('e0000000-0000-0000-0000-000000000001', '2026-10-09', 73200, 74800, 73000, 74500, 14200000, 'sample'),
  ('e0000000-0000-0000-0000-000000000002', '2026-10-09', 17950, 18300, 17900, 18250, 2100000, 'sample'),
  ('e0000000-0000-0000-0000-000000000003', '2026-10-09', 224.50, 228.00, 223.80, 227.10, 38500000, 'sample')
ON CONFLICT (instrument_id, date) DO UPDATE SET
  close = EXCLUDED.close;

-- 매수 체결
INSERT INTO trades (id, user_id, account_id, instrument_id, side, quantity, price, fee, tax, fx_rate, traded_at, memo)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    'buy',
    50,
    71500,
    350,
    0,
    1,
    '2026-06-15 09:30:00+09',
    '분할 매수 1차'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000002',
    'buy',
    200,
    17200,
    300,
    0,
    1,
    '2026-07-20 10:15:00+09',
    '월 정기 ETF 매수'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    'buy',
    15,
    215.50,
    2.50,
    0,
    1350,
    '2026-08-10 23:00:00+09',
    '미국 기술주 적립'
  )
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  price = EXCLUDED.price;

-- 10. 통장 거래내역 (transactions)
INSERT INTO transactions (id, user_id, account_id, date, amount, direction, category, merchant, memo)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-05', 4290000, 'in', 'salary', '(주)핀베스팅', '10월 급여 입금'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-05', 700000, 'out', 'saving', 'KB 청년도약계좌', '적금 자동이체'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-05', 300000, 'out', 'saving', '카카오뱅크 26주적금', '적금 자동이체'),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-10', 108000, 'out', 'insurance', 'KB/삼성화재', '보험료 통합 납부'),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-15', 75000, 'out', 'phone', 'SK텔레콤', '10월 통신요금 자동이체'),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-20', 180000, 'out', 'utilities', '관리사무소', '오피스텔 관리비'),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2026-10-25', 650000, 'out', 'housing', '임대인', '10월 월세 이체')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  category = EXCLUDED.category;
