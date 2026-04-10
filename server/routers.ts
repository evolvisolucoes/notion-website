import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as notion from "./notion";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  notion: router({
    getDatabaseContent: protectedProcedure
      .input(z.object({ databaseId: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          const hasAccess = await db.checkUserAccess(ctx.user.id, input.databaseId);
          if (!hasAccess) throw new Error("Acesso não autorizado a esta database.");
        }
        return notion.getDatabaseContent(input.databaseId);
      }),

    getPageContent: protectedProcedure
      .input(z.object({ pageId: z.string() }))
      .query(async ({ input }) => {
        return notion.getPageContent(input.pageId);
      }),

    getStatus: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        return notion.getStatus(input.email);
      }),

    addRow: protectedProcedure
      .input(z.object({
        databaseId: z.string(),
        properties: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          const hasAccess = await db.checkUserAccess(ctx.user.id, input.databaseId);
          if (!hasAccess) throw new Error("Acesso não autorizado a esta database.");
        }
        return notion.addRow(input.databaseId, input.properties as Record<string, string>);
      }),

    updateBlock: protectedProcedure
      .input(z.object({
        blockId: z.string(),
        type: z.string(),
        data: z.any(),
      }))
      .mutation(async ({ input }) => {
        return notion.updateBlock(input.blockId, input.type, input.data);
      }),

    signup: publicProcedure
      .input(z.object({
        nome: z.string(),
        email: z.string().email(),
        templateKey: z.string().optional(),
        templateNome: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return notion.signup(input.nome, input.email, input.templateKey, input.templateNome);
      }),

    health: protectedProcedure.query(async () => {
      const notionHealth = await notion.checkNotionHealth();
      // Check DB connectivity
      let dbConnected = false;
      try {
        const dbInstance = await db.getDb();
        if (dbInstance) {
          await dbInstance.execute("SELECT 1");
          dbConnected = true;
        }
      } catch { dbConnected = false; }
      return { ...notionHealth, dbConnected };
    }),
  }),

  resources: router({
    myResources: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return db.getAllResources();
      }
      return db.getUserResources(ctx.user.id);
    }),
  }),

  admin: router({
    listUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    promoteUser: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    listResources: adminProcedure.query(async () => {
      return db.getAllResources();
    }),

    addResource: adminProcedure
      .input(z.object({
        notionId: z.string(),
        type: z.enum(["database", "page"]),
        title: z.string(),
        description: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.addResource({
          notionId: input.notionId,
          type: input.type,
          title: input.title,
          description: input.description || null,
          icon: input.icon || null,
        });
        return { success: true };
      }),

    removeResource: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeResource(input.id);
        return { success: true };
      }),

    grantAccess: adminProcedure
      .input(z.object({ userId: z.number(), resourceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.grantAccess(input.userId, input.resourceId, ctx.user.id);
        return { success: true };
      }),

    revokeAccess: adminProcedure
      .input(z.object({ userId: z.number(), resourceId: z.number() }))
      .mutation(async ({ input }) => {
        await db.revokeAccess(input.userId, input.resourceId);
        return { success: true };
      }),

    getUserAccess: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserResources(input.userId);
      }),

    getResourceAccess: adminProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return db.getAccessForResource(input.resourceId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
