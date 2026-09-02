# 챗봇 입력: 한글 마지막 글자가 별도 메시지로 전송됨
- 날짜: 2026-09-02
- 환경: 맥북, Chrome/Safari, 한글 IME
- 어디서: `/chat` 입력창에서 Enter
- 증상: "…요약해줘" 입력 후 Enter → "…요약해" 와 "줘" 두 메시지로 전송
- 원인: 한글 조합(composition) 중 Enter가 조합 확정 이벤트와 keydown을 동시에 발생. `onKeyDown`에서 조합 상태를 안 봤음
- 해결: `!e.nativeEvent.isComposing` 조건 추가
- 재발 방지: 한글 입력 받는 모든 Enter 전송 핸들러에 `isComposing` 체크 (conventions에 추가)

# 화면 색상: 글자 흰색 + 배경 흰색
- 원인: `color-scheme: light dark`만 두고 배경·글자색을 명시하지 않아 OS/브라우저 설정 조합에 따라 대비가 깨짐
- 해결: CSS 변수로 라이트/다크 팔레트 명시(`prefers-color-scheme`), body 배경·글자색 고정
