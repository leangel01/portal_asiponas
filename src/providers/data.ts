import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { supabaseClient } from "../config/supabaseClient";

export const dataProvider = supabaseDataProvider(supabaseClient);
