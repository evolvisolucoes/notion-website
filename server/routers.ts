import { getSessionCookieOptions } from "./_core/cookies";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import bcrypt from "bcrypt";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as notion from "./notion";
import { COOKIE_NAME } from "@shared/const";


export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        // Hash the provided password and compare with bcrypt
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error("Email ou senha inválidos");
        }

        // Update last signed in
        await db.updateLastSignedIn(user.id);

        // Create JWT token with userId
        const secret = new TextEncoder().encode(ENV.jwtSecret);
        const token = await new SignJWT({ userId: user.id, email: user.email })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("365d")
          .sign(secret);

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

        return { success: true, user };
      }),

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
          const resources = await db.getUserResources(ctx.user.id);
          const hasAccess = resources.some(r => r.notionId === input.databaseId);
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
          const resources = await db.getUserResources(ctx.user.id);
          const hasAccess = resources.some(r => r.notionId === input.databaseId);
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

    health: protectedProcedure.query(async () => {
      const notionHealth = await notion.checkNotionHealth();
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

    getResourceById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getResourceById(input.id);
      }),
  }),

  admin: router({
    listUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    createUser: adminProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        // Hash password with bcrypt
        const passwordHash = await bcrypt.hash(input.password, 10);
        await db.createUser(input.email, passwordHash, input.name, input.role);
        return { success: true };
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
        await db.createResource({
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
        await db.deleteResource(input.id);
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
        return db.getUserAccessList(input.userId);
      }),

    getResourceAccess: adminProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return db.getResourceAccessList(input.resourceId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
