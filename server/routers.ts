// =============================================================
// King's Running AI Analytics — tRPC Routers
// Auth: Supabase Auth (replaces Manus OAuth)
// =============================================================
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Returns the current Supabase user (or null if not authenticated)
    me: publicProcedure.query(opts => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.name ?? user.email ?? null,
        role: (user.user_metadata?.role as string) ?? "user",
      };
    }),
    // Logout is handled client-side via supabase.auth.signOut()
    // This endpoint is kept for compatibility but does nothing server-side
    logout: publicProcedure.mutation(() => {
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
