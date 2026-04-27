-- Ensure chat tables are part of Supabase realtime publication.
-- This is idempotent and safe to run multiple times.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_message_conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Better update/delete payloads for realtime consumers.
ALTER TABLE IF EXISTS public.messages REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.direct_message_conversations REPLICA IDENTITY FULL;
