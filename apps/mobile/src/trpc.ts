import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@finvesting/api";
export const trpc = createTRPCReact<AppRouter>();
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
