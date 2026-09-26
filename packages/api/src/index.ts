import { router } from "./trpc";
import { accountsRouter } from "./routers/accounts";
import { dashboardRouter } from "./routers/dashboard";
import { marketRouter } from "./routers/market";
import { chatRouter } from "./routers/chat";
import { transactionsRouter } from "./routers/transactions";
import { profileRouter } from "./routers/profile";
import { tradesRouter } from "./routers/trades";
import { savingsRouter } from "./routers/savings";
import { insuranceRouter } from "./routers/insurance";
import { statementsRouter } from "./routers/statements";
import { taxRouter } from "./routers/tax";

export const appRouter = router({
  accounts: accountsRouter,
  dashboard: dashboardRouter,
  market: marketRouter,
  chat: chatRouter,
  transactions: transactionsRouter,
  profile: profileRouter,
  trades: tradesRouter,
  savings: savingsRouter,
  insurance: insuranceRouter,
  statements: statementsRouter,
  tax: taxRouter,
});
export type AppRouter = typeof appRouter;
export { createContext } from "./trpc";
