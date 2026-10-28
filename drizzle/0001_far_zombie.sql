ALTER TABLE `schedule_items` ADD `warn_distance` integer;--> statement-breakpoint
ALTER TABLE `schedule_items` ADD `warn_days` integer;--> statement-breakpoint
ALTER TABLE `schedule_items` ADD `baseline_odometer` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `schedule_items` ADD `baseline_date` text;