import { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "../config/supabaseClient";
import { UserProfile } from "../types/auth";

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
      return { success: true, redirectTo: "/" };
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
    if (data.session) return { authenticated: true };
    return { authenticated: false, redirectTo: "/login", logout: true };
  },

  getPermissions: async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role, asipona_id")
      .eq("id", user.id)
      .single();

    return profile || { role: "viewer" };
  },

  getIdentity: async (): Promise<UserProfile | null> => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      full_name: profile?.full_name || user.email,
      role: profile?.role || "viewer",
      asipona_id: profile?.asipona_id,
      department: profile?.department,
    };
  },

  onError: async (error) => {
    console.error(error);
    return { error };
  },
};