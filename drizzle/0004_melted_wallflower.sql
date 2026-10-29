ALTER TABLE `schedule_items` RENAME COLUMN "interval_days" TO "interval_months";--> statement-breakpoint
UPDATE `schedule_items` SET `interval_months` = MAX(1, CAST(ROUND(`interval_months` / 30.4375) AS INTEGER)) WHERE `interval_months` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `schedule_items` ADD `warn_months` integer;--> statement-breakpoint
UPDATE `schedule_items` SET `warn_months` = MAX(1, CAST(ROUND(`warn_days` / 30.4375) AS INTEGER)) WHERE `warn_days` IS NOT NULL;--> statement-breakpoint
UPDATE `schedule_items` SET `warn_months` = NULL WHERE `warn_months` >= `interval_months`;--> statement-breakpoint
ALTER TABLE `schedule_items` DROP COLUMN `warn_days`;
