import { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "../config/supabaseClient";
import { UserProfile } from "../types/auth";

const multiAsiponaRpc = supabaseClient as unknown as {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: any; error?: { message: string } | null }>;
};

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: { message: "Error al iniciar sesión", name: error.message },
      };
    }

    if (data?.user) {
      const { data: mustChangePassword } = await multiAsiponaRpc.rpc("get_must_change_password");
      return { success: true, redirectTo: mustChangePassword === true ? "/change-password" : "/" };
    }

    return { success: false, error: { message: "Credenciales inválidas", name: "AuthError" } };
  },

  logout: async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) return { success: false, error };
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const { data } = await supabaseClient.auth.getSession();
    if (data.session) {
      const { data: mustChangePassword } = await multiAsiponaRpc.rpc("get_must_change_password");
      if (mustChangePassword === true) return { authenticated: true, redirectTo: "/change-password" };
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: "/login", logout: true };
  },

  getPermissions: async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session?.user) return null;

    const [{ data: role }, { data: asiponaIds }] = await Promise.all([
      supabaseClient.rpc("get_my_role"),
      multiAsiponaRpc.rpc("get_my_asipona_ids"),
    ]);

    return { role: role || "viewer", asipona_ids: asiponaIds || [], asipona_id: asiponaIds?.[0] || null };
  },

  getIdentity: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const [{ data: role }, { data: asiponaIds }] = await Promise.all([
      supabaseClient.rpc("get_my_role"),
      multiAsiponaRpc.rpc("get_my_asipona_ids"),
    ]);

    return {
      id: user.id,
      email: user.email || "",
      full_name: user.user_metadata?.full_name || user.email || "Usuario",
      role: role || "viewer",
      asipona_ids: asiponaIds || [],
      asipona_id: asiponaIds?.[0] || null,
      department: user.user_metadata?.department,
    };
  },

  onError: async (error) => {
    console.error(error);
    return { error };
  },
};