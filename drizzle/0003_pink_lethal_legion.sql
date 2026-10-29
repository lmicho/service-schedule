CREATE TABLE `alert_dismissals` (
	`schedule_item_id` integer NOT NULL,
	`cycle_key` text NOT NULL,
	`dismissed_at` text DEFAULT (date('now')) NOT NULL,
	PRIMARY KEY(`schedule_item_id`, `cycle_key`),
	FOREIGN KEY (`schedule_item_id`) REFERENCES `schedule_items`(`id`) ON UPDATE no action ON DELETE cascade
);
