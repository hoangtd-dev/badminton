export type Role = 'admin' | 'user';
export type SessionStatus = 'upcoming' | 'ongoing' | 'completed';
export type TransactionType = 'topup' | 'court_fee' | 'shuttlecock' | 'water' | 'other';
export type ExpenseCategory = 'court_fee' | 'shuttlecock' | 'water' | 'other';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp_api_key: string | null;
  role: Role;
  balance: number;
  low_balance_threshold: number;
  avatar_url: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  played_at: string;
  location: string | null;
  status: SessionStatus;
  cost_per_player: number;
  duration_hours: number;
  created_by: string;
  created_at: string;
  vote_token: string | null;
  attendances?: Attendance[];
  group_expenses?: GroupExpense[];
}

export interface Attendance {
  id: string;
  session_id: string;
  player_id: string;
  checked_in_at: string | null;
  fee_charged: number;
  hours_attended: number | null;
  voted: boolean;
  profile?: Profile;
}

export interface Transaction {
  id: string;
  player_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  session_id: string | null;
  created_by: string;
  created_at: string;
  profile?: Profile;
}

export interface GroupExpense {
  id: string;
  session_id: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  player_id: string | null;
  created_by: string;
  created_at: string;
}
