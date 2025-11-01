export type Company = {
  id: string;
  created_at: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  conversionStatus: "Waiting" | "NoReach" | "Contacted" | "Negotiating" | "Confirmed";
  customFields: Record<string, any> | null;
  finalization_status?: "Pending" | "Finalized";
  finalized_by_id?: string | null;
  finalized_at?: string | null;
  assigned_data_collector_id?: string | null;
  assigned_converter_id?: string | null;
  // New fields
  industry?: string | null;
  employee_count?: string | null; // Student Batch - stored as VARCHAR in DB (e.g., "C26", "C27")
  annual_revenue?: number | null; // Company Size - number of employees
  notes?: string | null;
  contact_person?: string | null;
  company_type?: "Prospect" | "Customer" | "Partner" | "Competitor" | "Vendor" | null;
  rating?: number | null; // Salary in LPA
  is_public?: boolean;
  // For joining data
  data_collector_name?: string;
  converter_name?: string;
  finalized_by_name?: string;
};

export type Contact = {
  id: string;
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyId: string;
  // For joining data
  companies?: { name: string };
};

export type Task = {
  id: string;
  createdAt: string;
  created_at: string; // Legacy snake_case for compatibility
  title: string;
  description: string | null;
  status: "NotYet" | "InProgress" | "Completed";
  priority?: "Low" | "Medium" | "High";
  deadline: string | null;
  companyId: string | null;
  assignedToId: string;
  assignedById: string;
  // New fields for data collection tasks
  targetCount?: number | null;
  target_count?: number | null; // Legacy snake_case for form compatibility
  startDate?: string | null;
  start_date?: string | null; // Legacy snake_case for form compatibility
  taskType?: "General" | "DataCollection" | "Review";
  task_type?: "General" | "DataCollection" | "Review"; // Legacy snake_case for form compatibility
  // For joining data
  companies?: { name: string };
  users?: { full_name: string };
  assignedToName?: string;
  assignedByName?: string;
  assigned_by_name?: string;
};

export type Ticket = {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status?: "Open" | "InProgress" | "Resolved";
  priority?: "Low" | "Medium" | "High";
  isResolved: boolean;
  resolved_at: string | null;
  companyId: string;
  raisedById: string;
  assignedToId: string;
  // For joining data
  companies?: { name: string };
  raisedBy?: { full_name: string };
  assignedTo?: { full_name: string };
};

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Head" | "SubHead" | "Manager" | "Converter" | "DataCollector";
  region?: string | null;
};

export type Notification = {
  id: string;
  created_at: string;
  message: string;
  isRead: boolean;
  userId: string;
};

export type CustomFieldDefinition = {
  id: string;
  created_at: string;
  label: string;
  type: "Text" | "Number" | "Date";
};

export type Comment = {
  id: string;
  created_at: string;
  updated_at: string;
  content: string;
  company_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  // For joining data
  user_name?: string;
  user_role?: string;
};

export type FollowUp = {
  id: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  contacted_date: string;
  follow_up_date: string;
  follow_up_notes: string | null;
  contacted_by_id: string;
  // For joining data
  contacted_by_name?: string;
};

export type FollowUpDeletionRequest = {
  id: string;
  followup_id: string;
  company_id: string;
  requested_by_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // For joining data
  contacted_date?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
  company_name?: string;
  requested_by_name?: string;
  requested_by_role?: string;
  reviewed_by_name?: string;
};