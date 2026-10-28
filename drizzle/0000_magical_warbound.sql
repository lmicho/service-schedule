CREATE TABLE `maintenance_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`schedule_item_id` integer,
	`title` text NOT NULL,
	`performed_at` text NOT NULL,
	`odometer` integer NOT NULL,
	`cost` real,
	`shop` text,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_item_id`) REFERENCES `schedule_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `schedule_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vehicle_id` integer NOT NULL,
	`name` text NOT NULL,
	`interval_distance` integer,
	`interval_days` integer,
	`notes` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`make` text,
	`model` text,
	`year` integer,
	`vin` text,
	`odometer` integer DEFAULT 0 NOT NULL,
	`odometer_unit` text DEFAULT 'km' NOT NULL,
	`created_at` text DEFAULT (date('now')) NOT NULL
);
