import { UserRole } from "../config/constants";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  asipona_id?: string | null;
  department?: string;
}