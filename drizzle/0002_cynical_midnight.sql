PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_maintenance_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`schedule_item_id` integer,
	`title` text NOT NULL,
	`performed_at` text NOT NULL,
	`odometer` integer,
	`cost` real,
	`shop` text,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_item_id`) REFERENCES `schedule_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_maintenance_logs`("id", "vehicle_id", "schedule_item_id", "title", "performed_at", "odometer", "cost", "shop", "notes") SELECT "id", "vehicle_id", "schedule_item_id", "title", "performed_at", "odometer", "cost", "shop", "notes" FROM `maintenance_logs`;--> statement-breakpoint
DROP TABLE `maintenance_logs`;--> statement-breakpoint
ALTER TABLE `__new_maintenance_logs` RENAME TO `maintenance_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;