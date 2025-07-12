
import { supabase } from "@/integrations/supabase/client";
import { RpcFunction, RpcReturnTypes } from "@/types/supabase";

/**
 * Type-safe wrapper for Supabase RPC calls
 * @param functionName The name of the RPC function
 * @param params Parameters for the RPC function
 * @returns Result of the RPC call with proper typing
 */
export async function typedRpc<T extends RpcFunction>(
  functionName: T,
  params?: Record<string, any>
): Promise<{
  data: T extends keyof RpcReturnTypes ? RpcReturnTypes[T] | null : any;
  error: Error | null;
}> {
  const { data, error } = await supabase.rpc(functionName, params);
  return { data, error };
}
