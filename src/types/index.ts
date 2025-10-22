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
  created_at: string;
  title: string;
  description: string | null;
  status: "NotYet" | "InProgress" | "Completed";
  priority?: "Low" | "Medium" | "High";
  deadline: string | null;
  companyId: string;
  assignedToId: string;
  assignedById: string;
  // For joining data
  companies?: { name: string };
  users?: { full_name: string };
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