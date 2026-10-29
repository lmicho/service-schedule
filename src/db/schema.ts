import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const VEHICLE_TYPES = ["car", "motorcycle", "other"] as const;
export const ODOMETER_UNITS = ["km", "mi"] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];

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
  // When the odometer value was last set (YYYY-MM-DD); null = unknown.
  odometerUpdatedAt: text("odometer_updated_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(date('now'))`),
});

// Recurring rule, e.g. "Oil change" every 2000 km and/or 6 months.
export const scheduleItems = sqliteTable("schedule_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  intervalDistance: integer("interval_distance"),
  intervalMonths: integer("interval_months"),
  // Warn this long before the deadline (months for the time interval); null = 10% of the interval.
  warnDistance: integer("warn_distance"),
  warnMonths: integer("warn_months"),
  // Where counting starts until a job is logged against the rule.
  baselineOdometer: integer("baseline_odometer").notNull().default(0),
  baselineDate: text("baseline_date"), // YYYY-MM-DD
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
  odometer: integer("odometer"), // unknown for some old jobs
  cost: real("cost"),
  shop: text("shop"),
  notes: text("notes"),
});

// A closed alert. cycleKey (see lib/alerts.ts) ties the dismissal to one status
// and deadline, so the alert comes back once either changes.
export const alertDismissals = sqliteTable(
  "alert_dismissals",
  {
    scheduleItemId: integer("schedule_item_id")
      .notNull()
      .references(() => scheduleItems.id, { onDelete: "cascade" }),
    cycleKey: text("cycle_key").notNull(),
    dismissedAt: text("dismissed_at")
      .notNull()
      .default(sql`(date('now'))`),
  },
  (t) => [primaryKey({ columns: [t.scheduleItemId, t.cycleKey] })],
);

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
