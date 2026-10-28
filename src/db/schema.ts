import { relations, sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const VEHICLE_TYPES = ["car", "motorcycle", "other"] as const;
export const ODOMETER_UNITS = ["km", "mi"] as const;

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", { enum: VEHICLE_TYPES }).notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  vin: text("vin"),
  odometer: integer("odometer").notNull().default(0),
  odometerUnit: text("odometer_unit", { enum: ODOMETER_UNITS }).notNull().default("km"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(date('now'))`),
});

// Recurring rule, e.g. "Oil change" every 2000 km and/or 180 days.
export const scheduleItems = sqliteTable("schedule_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  intervalDistance: integer("interval_distance"),
  intervalDays: integer("interval_days"),
  notes: text("notes"),
});

// A job that was actually done. scheduleItemId is null for one-off work.
export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  scheduleItemId: integer("schedule_item_id").references(() => scheduleItems.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  performedAt: text("performed_at").notNull(), // YYYY-MM-DD
  odometer: integer("odometer").notNull(),
  cost: real("cost"),
  shop: text("shop"),
  notes: text("notes"),
});

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  scheduleItems: many(scheduleItems),
  logs: many(maintenanceLogs),
}));

export const scheduleItemsRelations = relations(scheduleItems, ({ one, many }) => ({
  vehicle: one(vehicles, { fields: [scheduleItems.vehicleId], references: [vehicles.id] }),
  logs: many(maintenanceLogs),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, { fields: [maintenanceLogs.vehicleId], references: [vehicles.id] }),
  scheduleItem: one(scheduleItems, {
    fields: [maintenanceLogs.scheduleItemId],
    references: [scheduleItems.id],
  }),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type ScheduleItem = typeof scheduleItems.$inferSelect;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
