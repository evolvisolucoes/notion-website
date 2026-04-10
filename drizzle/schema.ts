import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Notion resources (databases or pages) exposed as services on the platform.
 * Each resource maps to a real Notion database or page that can be assigned to users.
 */
export const notionResources = mysqlTable("notion_resources", {
  id: int("id").autoincrement().primaryKey(),
  notionId: varchar("notionId", { length: 64 }).notNull().unique(),
  type: mysqlEnum("type", ["database", "page"]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotionResource = typeof notionResources.$inferSelect;
export type InsertNotionResource = typeof notionResources.$inferInsert;

/**
 * Access control: maps users to Notion resources they can access.
 * This is the core of the SaaS model — each resource is a service that can be granted/revoked per user.
 */
export const userAccess = mysqlTable("user_access", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  resourceId: int("resourceId").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  grantedBy: int("grantedBy"),
});

export type UserAccess = typeof userAccess.$inferSelect;
export type InsertUserAccess = typeof userAccess.$inferInsert;
