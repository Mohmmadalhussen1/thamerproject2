export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export type ActionUserResponse = {
  message: string;
  user: {
    id: number;
    email: string;
  };
};

export interface PaginationResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Score {
  id: number;
  year: number;
  score: number;
  score_type: string;
  file: { key?: string; url?: string };
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  cr: string;
  website: string;
  description: string;
  tagline: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  logo: { url: string; key: string };
  awards: string[] | null;
  sectors: string[] | null;
  created_at: string;
  last_updated: string;
  scores: Score[];
  rejection_reason: string;
}

export interface CompanyFiltering {
  score_type?: string;
  min_year?: string;
  max_year?: string;
  company_name?: string;
  sectors?: string;
}

export interface Sender {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture: string;
  company_name: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  sender?: Sender; // Optional because it might not exist in all types
}

export enum NotificationTypeEnum {
  GENERAL = "GENERAL",
  COMMENT = "COMMENT",
  MESSAGE = "MESSAGE",
  SYSTEM = "SYSTEM",
  VIEW = "VIEW",
  ALERT = "ALERT",
  FOLLOW = "FOLLOW",
  OTHER = "OTHER",
}

export interface NotificationResponse {
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  items: NotificationItem[];
  type: NotificationTypeEnum;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  profile_picture: string | null; // null if no profile picture is provided
  last_login: string; // ISO 8601 date string
  last_login_ip: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  status: string;
}

export interface CompanyStats {
  total_views: number;
  views_last_7_days: number;
  views_last_30_days: number;
  anonymous_views: number;
  authenticated_views: number;
}

interface SubscriptionData {
  id: string;
  plan_name: string;
  plan_price: number;
  duration_days: number;
  start_date: string; // Assuming ISO date format
  end_date: string; // Assuming ISO date format
  status: string;
  amount_paid: number;
}

interface PaymentData {
  order_id?: string | null;
  status?: string | null;
  trans_id?: string | null;
  amount?: number | null;
  currency?: string | null;
  transaction_date?: string | null; // Assuming ISO date format
  failure_reason?: string | null;
}

export interface UserSubscriptionResponse {
  subscription: SubscriptionData | null;
  payment: PaymentData | null;
}

export interface PaymentInitiateResponse {
  message: string;
  order_id: string;
  redirect_url: string;
}

export interface PaymentStatusResponse {
  status: string;
  payment_status: {
    statusCode: number;
    responseBody: PaymentResponseBody;
  };
}

export interface PaymentResponseBody {
  date: string;
  status: "settled" | "decline"; // Define possible statuses
  brand: string;
  reason: string;
  order: OrderDetails;
  customer: CustomerDetails;
  payment_id: string;
}

export interface OrderDetails {
  number: string;
  amount: string;
  currency: string;
  description: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
}

export interface Viewer {
  viewer_id: number;
  viewer_name: string;
  viewer_email: string;
  viewed_at: string; // ISO date string
  profile_picture: string;
  company_name: string;
}

export interface ViewersResponse extends PaginationResponse {
  items: Viewer[];
}
