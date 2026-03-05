CREATE INDEX "messages_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "messages_thread_id_created_at_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_unread_idx" ON "messages" USING btree ("thread_id","sender_type","read_at");--> statement-breakpoint
CREATE INDEX "threads_updated_at_idx" ON "threads" USING btree ("updated_at");