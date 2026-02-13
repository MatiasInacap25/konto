import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached auth check - deduplicated per request
 * Prevents multiple auth calls in the same request (server-cache-react)
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
});

/**
 * Get user or throw - use in protected routes
 */
export const requireUser = cache(async () => {
  const user = await getUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
});
