import type { Database } from "../../../types/supabase";

export type Tables = Database["public"]["Tables"];
export type Asipona = Tables["asiponas"]["Row"];
export type DirectoryContact = Tables["directory_contacts"]["Row"];
export type Location = Tables["locations"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type BudgetItem = Tables["budget_items"]["Row"];
export type News = Tables["news"]["Row"];
export type Goal = Tables["goals"]["Row"];
export type Contract = Tables["contracts"]["Row"];
export type Investment = Tables["investment_projects"]["Row"];

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
};
