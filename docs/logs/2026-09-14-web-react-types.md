# 2026-09-14 — 웹 React 19 / 모바일 React 18 타입 충돌

## 증상
`pnpm --filter @finvesting/web typecheck`가 ReactMarkdown·Suspense·forwardRef 패널에서 TS2786. `ReactElement`가 `ReactNode`에 대입되지 않음.

## 원인
웹은 React 19 + `@types/react` 19. 모바일 Expo는 React 18.3 + `@types/react` 18. Next `styled-jsx`가 `react`를 해석할 때 pnpm 저장소의 18 타입이 프로그램에 들어와 JSX 전역과 import가 갈라짐.

## 수정
`apps/web/tsconfig.json`에 `typeRoots: ["./node_modules/@types"]`와 `paths`로 `react`/`react-dom`을 웹의 `@types/react` 19에 고정. 소스에 타입 단언을 넣지 않음.

## 확인
`pnpm --filter @finvesting/web typecheck` 통과. 모바일 typecheck도 통과.
