import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import { openaiChatProcedure } from "@/backend/trpc/routes/chat/openai/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  chat: createTRPCRouter({
    openai: openaiChatProcedure,
  }),
});

export type AppRouter = typeof appRouter;
