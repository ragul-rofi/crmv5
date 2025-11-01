export interface CreateCompanyDto {
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  conversionStatus?: 'Waiting' | 'NoReach' | 'Contacted' | 'Negotiating' | 'Confirmed';
  customFields?: Record<string, any>;
  assigned_data_collector_id?: string;
  assigned_converter_id?: string;
  industry?: string;
  company_type?: 'YES' | 'NO';
  employee_count?: number;
  annual_revenue?: number;
  notes?: string;
  contact_person?: string;
  rating?: number;
  is_public?: boolean;
  status?: 'HOT' | 'WARM' | 'COLD' | 'NEW' | 'CLOSED' | 'DRIVE COMPLETED' | 'ALREADY IN CONTACT' | 'IN HOLD';
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

export interface CompanyResponseDto {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  conversionStatus: string;
  finalization_status: string;
  created_at: Date;
  updated_at: Date;
  data_collector_name?: string;
  converter_name?: string;
  finalized_by_name?: string;
  industry?: string;
  company_type?: string;
  employee_count?: number;
  annual_revenue?: number;
  notes?: string;
  contact_person?: string;
  rating?: number;
  is_public: boolean;
  status?: string;
}