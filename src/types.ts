import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Role = 'SUPER_ADMIN' | 'MARKETER' | 'SALES_AGENT' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  clientName: string;
  insuranceType: string;
  classOfBusiness?: string; // added for commission rate lookup
  startDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Pending';
  premium: number;
  // New fields for insurance policy format
  datePaid?: string;
  outstandingPremiumPaid?: string;
  vehicleNumber?: string;
  staffName?: string;
  isNewRenewal?: 'NEW' | 'RENEWAL';
  renewalDate?: string;
  insuranceCompany?: string;
  premiumAmtGhs?: number;
  premiumSticker?: number;
  commissionPercent?: number;
  commissionExpectedGhs?: number;
  with75Percent?: number;
  netComm?: number;
  dateCommissionPaid?: string;
  overrider?: number;
  netOverrider?: number;
  dateOverriderPaid?: string;
  // Backend snake_case properties (for API responses)
  policy_number?: string;
  client_id?: string;
  client_name?: string;
  insurance_type?: string;
  class_of_business?: string;
  start_date?: string;
  expiry_date?: string;
  date_paid?: string;
  outstanding_premium_paid?: string;
  vehicle_number?: string;
  staff_name?: string;
  is_new_renewal?: 'NEW' | 'RENEWAL';
  renewal_date?: string;
  insurance_company?: string;
  premium_amt_ghs?: number;
  premium_sticker?: number;
  commission_percent?: number;
  commission_expected_ghs?: number;
  with_75_percent?: number;
  net_comm?: number;
  date_commission_paid?: string;
  net_overrider?: number;
  date_overrider_paid?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  joinedDate: string;
}

export interface SMSLog {
  id: string;
  recipient: string;
  message: string;
  status: 'Sent' | 'Pending' | 'Failed';
  sent_at: string;
  created_at?: string;
}

export interface CommissionRate {
  id: string;
  class_of_business: string;
  agreed_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  // Frontend convenience properties (mapped from backend)
  assignedTo?: string;
  date?: string;
  progress?: number;
  notes?: string;
  communicationHistory?: Message[];
}

export interface Message {
  id: string;
  type: 'SMS' | 'Email' | 'Note';
  content: string;
  date: string;
  sender: string;
}
