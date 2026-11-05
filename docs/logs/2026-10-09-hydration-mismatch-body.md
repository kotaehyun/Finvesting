# 2026-10-09 — body 태그 Hydration Mismatch (antigravity-scroll-lock)

## 증상
콘솔 에러:
```text
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
...
<RootLayout>
  <html lang="ko">
    <body
-     className="antigravity-scroll-lock"
    >
at body
at RootLayout (src\app\layout.tsx:10:7)
```

## 원인
Antigravity IDE 브라우저 서브에이전트 또는 브라우저 확장 프로그램이 React Hydration 완료 전 클라이언트 DOM의 `<body>` 태그에 `antigravity-scroll-lock` 등의 클래스나 속성을 주입하여 서버 SSR 결과(`<body>`)와 클라이언트 DOM 속성 간 불일치(Hydration Mismatch)가 발생함.

## 해결
`apps/web/src/app/layout.tsx`의 `<html lang="ko">` 및 `<body>` 태그에 `suppressHydrationWarning` 속성을 추가하여, 브라우저 확장/외부 도구에 의해 주입되는 루트 속성 차이로 인한 하이드레이션 경고를 방어함.
```tsx
<html lang="ko" suppressHydrationWarning>
  <body suppressHydrationWarning>
```
