export type MeResponse = {
  ok: boolean;
  error?: string;
  subscriptionExpired?: boolean;
  companyName?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: "boss" | "manager" | "rep" | "back_office";
    companyUserId: string;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
    address?: string;
    plan?: string;
    subscriptionEndsAt?: string | null;
    staffLimit?: number;
    staffCount?: number;
  };
};

export type Staff = {
  company_user_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "boss" | "manager" | "rep" | "back_office";
  status: "invited" | "active" | "inactive";
  phone: string | null;
  manager_company_user_id: string | null;
  created_at: string;
  updated_at?: string;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  assigned_shops_count?: number;
};

export type StaffCounts = { active: number; invited: number; inactive: number };

export type Shop = {
  id: string;
  external_shop_code: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  is_active: boolean;
  assignment_count: number;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  operating_hours: string | null;
  preferred_visit_days: string | null;
  payment_status: string | null;
  region_id: string | null;
  region_name?: string | null;
};

export type StaffListResponse = {
  ok: boolean;
  error?: string;
  staff?: Staff[];
  counts?: StaffCounts;
};
export type ShopListResponse = { ok: boolean; error?: string; shops?: Shop[]; total?: number };

export type ShopAssignment = {
  id: string;
  shop_id: string;
  shop_name?: string;
  rep_company_user_id: string;
  is_primary: boolean;
};

export type ShopAssignmentListResponse = {
  ok: boolean;
  error?: string;
  assignments?: ShopAssignment[];
};

export type Lead = {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  shop_id: string | null;
  shop_name?: string | null;
  assigned_rep_company_user_id: string | null;
  assigned_rep_name?: string | null;
  notes: string | null;
  created_at: string;
  converted_at?: string | null;
};

export type LeadListResponse = {
  ok: boolean,
  error?: string;
  leads?: Lead[];
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  rep_company_user_id: string;
  rep_name?: string;
  shop_id: string | null;
  shop_name?: string | null;
  lead_id: string | null;
  lead_name?: string | null;
  created_at: string;
};

export type TaskListResponse = {
  ok: boolean;
  error?: string;
  tasks?: Task[];
};

export type Order = {
  id: string;
  order_number: string;
  shop_id: string;
  shop_name?: string;
  rep_company_user_id: string;
  rep_name?: string;
  total_amount: string;
  status: string;
  notes: string | null;
  created_at: string;
  placed_at?: string;
};

export type OrderListResponse = {
  ok: boolean;
  error?: string;
  orders?: Order[];
};

export type Visit = {
  id: string;
  shop_id: string;
  rep_company_user_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  shop_name: string;
  rep_name: string;
  is_verified?: boolean;
  distance_m?: number | null;
  verification_method?: string | null;
  gps_accuracy_m?: number | null;
  exception_reason?: string | null;
  exception_note?: string | null;
  approved_by_manager_id?: string | null;
  approved_at?: string | null;
  flagged_by_manager_id?: string | null;
  manager_note?: string | null;
};

export type VisitListResponse = {
  ok: boolean;
  error?: string;
  visits?: Visit[];
};

export type AttendanceLog = {
  id: string;
  rep_company_user_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  notes: string | null;
  rep_name: string;
};

export type AttendanceLogListResponse = {
  ok: boolean;
  error?: string;
  logs?: AttendanceLog[];
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  is_active: boolean;
  current_price: string | null;
  currency_code: string | null;
  created_at: string;
  updated_at: string;
  order_count?: number;
};

export type ProductListResponse = {
  ok: boolean;
  error?: string;
  products?: Product[];
  total?: number;
};

export type CoverageReportItem = {
  rep_id: string;
  rep_name: string;
  total_assigned: number;
  shops_visited: number;
  visit_count: number;
  orders_count: number;
  total_sales: number;
  coverage_percentage: number;
};

export type CoverageReportResponse = {
  ok: boolean;
  error?: string;
  report?: CoverageReportItem[];
};
