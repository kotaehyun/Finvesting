"use client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@finvesting/api";
export const trpc = createTRPCReact<AppRouter>();
