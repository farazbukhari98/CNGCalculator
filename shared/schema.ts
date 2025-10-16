import { pgTable, text, integer, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table - not used for this app but required by the template
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Saved strategies table
export const savedStrategies = pgTable("saved_strategies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  vehicleParameters: jsonb("vehicle_parameters").notNull(),
  stationConfig: jsonb("station_config").notNull(),
  fuelPrices: jsonb("fuel_prices").notNull(),
  timeHorizon: integer("time_horizon").notNull(),
  deploymentStrategy: text("deployment_strategy").notNull(),
  vehicleDistribution: jsonb("vehicle_distribution"),
});

export const insertSavedStrategySchema = createInsertSchema(savedStrategies).omit({ 
  id: true,
  createdAt: true 
});
export type InsertSavedStrategy = z.infer<typeof insertSavedStrategySchema>;
export type SavedStrategy = typeof savedStrategies.$inferSelect;