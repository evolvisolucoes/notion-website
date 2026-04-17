import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Now uses email/password for authentication instead of OAuth.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User credentials for email/password authentication.
 * Stores hashed passwords separately for security.
 */
export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

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
