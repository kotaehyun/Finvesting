import { router } from "./trpc.js";
import { accountsRouter } from "./routers/accounts.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { marketRouter } from "./routers/market.js";
import { chatRouter } from "./routers/chat.js";

export const appRouter = router({
  accounts: accountsRouter,
  dashboard: dashboardRouter,
  market: marketRouter,
  chat: chatRouter,
});
export type AppRouter = typeof appRouter;
export { createContext } from "./trpc.js";
