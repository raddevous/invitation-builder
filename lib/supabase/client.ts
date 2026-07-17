import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isConfigured =
  supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://");

function createNoopClient(): SupabaseClient {
  const subscribable = {
    on: () => subscribable,
    subscribe: () => ({ unsubscribe: () => {} }),
  };
  return {
    channel: () => subscribable,
    removeChannel: () => Promise.resolve([]),
  } as unknown as SupabaseClient;
}

export const supabase: SupabaseClient = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopClient();
