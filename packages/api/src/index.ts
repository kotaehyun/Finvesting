import { router } from "./trpc";
import { accountsRouter } from "./routers/accounts";
import { dashboardRouter } from "./routers/dashboard";
import { marketRouter } from "./routers/market";
import { chatRouter } from "./routers/chat";

export const appRouter = router({
  accounts: accountsRouter,
  dashboard: dashboardRouter,
  market: marketRouter,
  chat: chatRouter,
});
export type AppRouter = typeof appRouter;
export { createContext } from "./trpc";
