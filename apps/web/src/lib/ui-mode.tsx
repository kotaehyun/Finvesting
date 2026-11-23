"use client";
// ADR 0067. 레이아웃이 쿠키로 읽은 모드를 페이지에 넘긴다.
import { createContext, useContext } from "react";
import { DEFAULT_UI_MODE, type UiMode } from "@finvesting/core";

const UiModeContext = createContext<UiMode>(DEFAULT_UI_MODE);

export function UiModeProvider({ mode, children }: { mode: UiMode; children: React.ReactNode }) {
  return <UiModeContext.Provider value={mode}>{children}</UiModeContext.Provider>;
}

export function useUiMode(): UiMode {
  return useContext(UiModeContext);
}
