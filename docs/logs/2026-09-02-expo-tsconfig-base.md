# File 'expo/tsconfig.base' not found
- 날짜: 2026-09-02
- 환경: 맥북, Cursor IDE, pnpm 모노레포
- 어디서: `apps/mobile/tsconfig.json` (`extends: "expo/tsconfig.base"`)
- 증상: `File 'expo/tsconfig.base' not found.`
- 원인: 패키지는 `apps/mobile/node_modules/expo`에만 있고 워크스페이스 루트에는 없음. IDE TypeScript는 루트에서 모듈을 찾아 실패. `tsc`를 패키지 cwd에서 돌리면 통과했음.
- 해결: `extends`를 제거하고 RN/strict 옵션을 `apps/mobile/tsconfig.json`에 인라인. 워크스페이스 `.vscode/settings.json`에서 `typescript.tsdk`를 루트 `node_modules/typescript`로 고정. `pnpm --filter @finvesting/mobile typecheck` 통과
- 재발 방지: 앱 tsconfig의 `extends`는 저장소 안 파일만 가리키거나, 아예 인라인한다. Problems에 `expo/tsconfig.base`(1행 14–34열)가 남으면 예전 한 줄 파일의 캐시이므로 `TypeScript: Restart TS Server`를 실행한다.
