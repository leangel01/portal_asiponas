import type { Database } from "../../../types/supabase";

export type Tables = Database["public"]["Tables"];
export type Asipona = Tables["asiponas"]["Row"];
export type DirectoryContact = Tables["directory_contacts"]["Row"];
export type Location = Tables["locations"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type BudgetItem = Tables["budget_items"]["Row"];
export type News = Tables["news"]["Row"];
export type Goal = Tables["goals"]["Row"];
export type Contract = {
  id: string;
  asipona_id: string;
  code: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  fiscal_year: number;
  tax_amount: number | null;
  currency: string | null;
  effective_date: string | null;
  published_date: string | null;
  contract_type: string;
  url: string;
};
export type Investment = Tables["investment_projects"]["Row"];
export type HistoricalTimeline = Tables["historical_timeline"]["Row"];

export type ScopedDashboardData = {
  contacts: DirectoryContact[];
  locations: Location[];
  news: News[];
  goals: Goal[];
  contracts: Contract[];
  investments: Investment[];
  budget?: Budget;
  budgets: Budget[];
  budgetItems: BudgetItem[];
  timeline: HistoricalTimeline[];
};
