# 제품 개요

> 🇺🇸 English: [overview.en.md](./overview.en.md)

## 한 줄 정의
흩어진 계좌·카드·증권·투자 정보와 돈의 흐름을 하나로 연결하고, 수집한 시장 정보로 투자 판단을 돕는 개인 금융 업무 터미널.

## 핵심 사용자 (결정됨)
**본인 — 근로자 투자자.** 자체 사용 목적. 최적화가 끝나면 서비스화 검토.

## 사용자가 원하는 것
- 자산 현황(현금·예적금·주식·코인)과 순자산을 한 화면에서
- 월 현금흐름: 근로소득 대비 소비율·저축률, 고정비/변동비
- 소득·자산 구조에 따른 **예적금/투자/소비 배분 가이드**
- 물가·금리·환율 등 거시지표와 뉴스·시세를 **자동 수집**
- 수집 데이터 + 본인 데이터로 **챗봇과 대화하며 투자 판단**

## 범위
### MVP 1단계 (현재)
- Account + Investment: 계좌·거래·보유 종목 등록, 대시보드
- Market 수집: 뉴스 RSS, 업비트 시세, ECOS 거시지표 (worker)
- AI 챗봇: 로컬 Ollama + 수집 데이터 컨텍스트
### 이후
- 2단계: Market Terminal UI(관심 종목, 차트, 경제 캘린더), KIS 국내·해외 시세
- 3단계: Tax + Year-End (본인 근로소득 기준 연말정산, 해외주식 양도세, 배당소득)
- 4단계: Accounting + Labor/HR — 서비스화 시 프리랜서·사업자용으로 확장
- 5단계: AI 고도화 (RAG, 이상 지출 탐지, 리스크 설명)

## 원본 기획서
`Finvesting_프로젝트_소개서.pdf` (Concept Brief v0.1) — 9개 모듈(Account, Investment, Market Terminal, Tax, Year-End, Accounting, Labor/HR, Research, AI Assistant), 대표 기능 Financial Timeline.
