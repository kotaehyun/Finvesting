# 0066 — ROE·PER·PBR 삼각은 Yahoo 스냅샷 + 표시용 스케일
- 상태: 채택 (2026-11-22)
- 배경: `/fundamentals`에 배수·ROE가 표로만 있어, 한 종목의 ROE·PER·PBR 균형을 한눈에 보기 어렵다.
- 결정: 세 값이 모두 있는 주식만 정삼각 SVG를 그린다. 바깥쪽 = ROE 높음·PER/PBR 낮음. 표시 목록 주식이 메트릭당 3개 이상이면 순위 스케일, 아니면 절대 축(ROE 30%·PER 40·PBR 5). score는 도형용이며 투자 점수·목표가 아니다. 숫자는 Yahoo 일 스냅샷. Yahoo가 PER·PBR을 비우면(국내 흔함) 시총 통화와 `financialCurrency`가 같을 때만 시총÷순이익(TTM)으로 PER, PER×ROE로 PBR을 채우고 「시총추정」을 표시한다. `financialCurrency`가 없으면 KRX·KOSDAQ만. PBR은 PER·ROE 정의가 다르면 시총÷자본과 어긋날 수 있다. 새 숫자를 만들지 않고 저장된 칸만 나눈다.
- 결과: 표 행을 고르면 삼각이 바뀐다. ETF·빈 칸은 그리지 않는다. 기본 선택은 세 값이 있는 주식(추정 포함).
