const API_URL = '/api/v1';
const AUTH_API_URL = '/api/v1'; // Auth routes are now at /api/v1

class ApiClient {
  private baseUrl: string;
  private authBaseUrl: string;

  constructor() {
    // Use v1 API for most endpoints
    this.baseUrl = API_URL;
    // Use legacy API for auth endpoints
    this.authBaseUrl = AUTH_API_URL;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    return this.makeRequest(url, options);
  }

  private async authRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.authBaseUrl}${endpoint}`;
    return this.makeRequest(url, options);
  }

  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType?.includes('application/json');
    
    // Handle empty responses or non-JSON responses
    if (!hasJsonContent || response.status === 204) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return {};
    }

    // Try to parse JSON, handle parsing errors
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      // Standardized error format with validation details
      const error: any = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      // Preserve validation errors array if present
      if (data.errors) {
        error.errors = data.errors;
      }
      throw error;
    }

    // All responses should now be in standardized format
    if (data.success === false) {
      const error: any = new Error(data.error || 'Request failed');
      // Preserve validation errors array if present
      if (data.errors) {
        error.errors = data.errors;
      }
      throw error;
    }

    return data;
  }

  // Extract data and pagination from standardized response
  private normalizeListResponse(response: any): { data: any[]; pagination?: any } {
    // Standardized response format: { success: true, data: T[], pagination?: {...} }
    return {
      data: Array.isArray(response.data) ? response.data : [],
      pagination: response.pagination
    };
  }

  // Auth methods - use legacy API
  async login(email: string, password: string) {
    const response = await this.authRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  }

  async signup(data: { email: string; password: string; full_name: string; role?: string }) {
    const response = await this.authRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.authRequest('/auth/me');
    return response.data;
  }

  // Companies - use v1 API
  async getCompanies(page: number = 1, limit: number = 50) {
    const response = await this.request(`/companies?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getMyCompanies(page: number = 1, limit: number = 50) {
    const response = await this.request(`/companies/my?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getFinalizedCompanies(page: number = 1, limit: number = 50) {
    const response = await this.request(`/companies/finalized?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getApprovalQueue(page: number = 1, limit: number = 50) {
    const response = await this.request(`/companies/approvals?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async bulkApproval(ids: string[], action: 'approve' | 'reject') {
    const response = await this.request(`/companies/approvals/bulk`, {
      method: 'PUT',
      body: JSON.stringify({ ids, action })
    });
    return response.data || response;
  }

  async getCompany(id: string) {
    const response = await this.request(`/companies/${id}`);
    return response.data;
  }

  async getContactsForCompany(companyId: string) {
    const response = await this.request(`/contacts?companyId=${companyId}`);
    return response.data || [];
  }

  async getTasksForCompany(companyId: string) {
    const response = await this.request(`/tasks?companyId=${companyId}`);
    return response.data || [];
  }

  async getTicketsForCompany(companyId: string) {
    const response = await this.request(`/tickets?companyId=${companyId}`);
    return response.data || [];
  }

  async createCompany(data: any) {
    const response = await this.request('/companies', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateCompany(id: string, data: any) {
    const response = await this.request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteCompany(id: string) {
    const response = await this.request(`/companies/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async finalizeCompany(id: string) {
    const response = await this.request(`/companies/${id}/finalize`, { method: 'PUT' });
    return response.data;
  }

  async unfinalizeCompany(id: string) {
    const response = await this.request(`/companies/${id}/unfinalize`, { method: 'PUT' });
    return response.data;
  }

  // Additional legacy methods
  async getContacts(page: number = 1, limit: number = 50) {
    const response = await this.request(`/contacts?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async createContact(data: any) {
    const response = await this.request('/contacts', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateContact(id: string, data: any) {
    const response = await this.request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteContact(id: string) {
    const response = await this.request(`/contacts/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getTasks(page: number = 1, limit: number = 50) {
    const response = await this.request(`/tasks?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getMyTasks(page: number = 1, limit: number = 20) {
    const response = await this.request(`/tasks/my?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getMyOpenTasksCount() {
    const response = await this.request('/tasks/my/count');
    return response; // Backend returns { count: number } directly
  }

  async createTask(data: any) {
    const response = await this.request('/tasks', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateTask(id: string, data: any) {
    const response = await this.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteTask(id: string) {
    const response = await this.request(`/tasks/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getTickets(page: number = 1, limit: number = 50) {
    const response = await this.request(`/tickets?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getMyTickets(page: number = 1, limit: number = 20) {
    const response = await this.request(`/tickets/my?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getMyOpenTicketsCount() {
    const response = await this.request('/tickets/my/count');
    return response; // Backend returns { count: number } directly
  }

  async createTicket(data: any) {
    const response = await this.request('/tickets', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateTicket(id: string, data: any) {
    const response = await this.request(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteTicket(id: string) {
    const response = await this.request(`/tickets/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getUsers(page: number = 1, limit: number = 50) {
    const response = await this.request(`/users?page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  async getUsersList() {
    const response = await this.request('/users/list');
    return response.data;
  }

  async getUser(id: string) {
    const response = await this.request(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: any) {
    const response = await this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteUser(id: string) {
    const response = await this.request(`/users/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getCustomFields() {
    const response = await this.request('/custom-fields');
    return response.data;
  }

  async createCustomField(data: any) {
    const response = await this.request('/custom-fields', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteCustomField(id: string) {
    const response = await this.request(`/custom-fields/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getNotifications() {
    const response = await this.request('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.request(`/notifications/${id}/read`, { method: 'PUT' });
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.request('/notifications/mark-all-read', { method: 'PUT' });
    return response.data;
  }

  async createNotification(data: { userId: string; message: string }) {
    const response = await this.request('/notifications', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.request(`/notifications/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getComments(companyId: string) {
    const response = await this.request(`/comments/company/${companyId}`);
    return response.data;
  }

  async createComment(data: { content: string; company_id: string; parent_comment_id?: string }) {
    const response = await this.request('/comments', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateComment(id: string, content: string) {
    const response = await this.request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify({ content }) });
    return response.data;
  }

  async deleteComment(id: string) {
    const response = await this.request(`/comments/${id}`, { method: 'DELETE' });
    return response.data;
  }

  async getDashboardAnalytics(filter: string = 'month', startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ filter });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await this.request(`/analytics/dashboard?${params.toString()}`);
    return response.data;
  }

  // Analytics methods
  async getAnalyticsDashboard() {
    const response = await this.request('/analytics/dashboard');
    return response.data;
  }

  async getAnalyticsCompanies() {
    const response = await this.request('/analytics/companies');
    return response.data;
  }

  async getAnalyticsTasks() {
    const response = await this.request('/analytics/tasks');
    return response.data;
  }

  async getAnalyticsTickets() {
    const response = await this.request('/analytics/tickets');
    return response.data;
  }

  async getAnalyticsActivity(days: number = 30) {
    const response = await this.request(`/analytics/activity?days=${days}`);
    return response.data;
  }

  // Admin methods
  async updateRolePermissions(permissions: any) {
    const response = await this.request('/admin/permissions/roles', { method: 'PUT', body: JSON.stringify(permissions) });
    return response.data;
  }

  async updateUserTicketPermission(userId: string, canRaiseTickets: boolean) {
    const response = await this.request(`/admin/permissions/tickets/${userId}`, { 
      method: 'PUT', 
      body: JSON.stringify({ canRaiseTickets }) 
    });
    return response.data;
  }

  async updateCompanyVisibility(companyId: string, isPublic: boolean) {
    const response = await this.request(`/admin/companies/${companyId}/visibility`, { 
      method: 'PUT', 
      body: JSON.stringify({ isPublic }) 
    });
    return response.data;
  }

  async bulkUpdateCompanyVisibility(companyIds: string[], isPublic: boolean) {
    const response = await this.request('/admin/companies/visibility/bulk', { 
      method: 'PUT', 
      body: JSON.stringify({ companyIds, isPublic }) 
    });
    return response.data;
  }

  async updateSystemSetting(key: string, value: any) {
    const response = await this.request(`/admin/settings/${key}`, { 
      method: 'PUT', 
      body: JSON.stringify({ value }) 
    });
    return response.data;
  }

  async getSystemSetting(key: string) {
    const response = await this.request(`/admin/settings/${key}`);
    return response.data;
  }

  async getAllSystemSettings() {
    const response = await this.request('/admin/settings');
    return response.data;
  }

  // Search methods
  async search(query: string) {
    const response = await this.request(`/search?q=${encodeURIComponent(query)}`);
    return response;
  }

  async searchCompanies(query: string, page: number = 1, limit: number = 20) {
    const response = await this.request(`/search/companies?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return this.normalizeListResponse(response);
  }

  // Follow-ups methods
  async getFollowUpsForCompany(companyId: string) {
    const response = await this.request(`/follow-ups?companyId=${companyId}`);
    return response.data;
  }

  async createFollowUp(data: { company_id: string; contacted_date: string; follow_up_date: string; follow_up_notes?: string }) {
    const response = await this.request('/follow-ups', { method: 'POST', body: JSON.stringify(data) });
    return response.data;
  }

  async updateFollowUp(id: string, data: { contacted_date?: string; follow_up_date?: string; follow_up_notes?: string }) {
    const response = await this.request(`/follow-ups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return response.data;
  }

  async deleteFollowUp(id: string) {
    const response = await this.request(`/follow-ups/${id}`, { method: 'DELETE' });
    return response.data;
  }

  // Follow-up deletion requests methods
  async getFollowUpDeletionRequests() {
    const response = await this.request('/followup-deletion-requests');
    return response.data;
  }

  async getMyFollowUpDeletionRequests() {
    const response = await this.request('/followup-deletion-requests/my');
    return response.data;
  }

  async createFollowUpDeletionRequest(data: { followup_id: string; reason?: string }) {
    const response = await this.request('/followup-deletion-requests', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
    return response.data;
  }

  async reviewFollowUpDeletionRequest(id: string, action: 'approve' | 'reject', rejection_reason?: string) {
    const response = await this.request(`/followup-deletion-requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, rejection_reason })
    });
    return response.data;
  }

  async cancelFollowUpDeletionRequest(id: string) {
    const response = await this.request(`/followup-deletion-requests/${id}`, { method: 'DELETE' });
    return response.data;
  }

  // Bulk operations
  async bulkUpdateCompanies(ids: string[], data: any) {
    const response = await this.request('/companies/bulk', { 
      method: 'PUT', 
      body: JSON.stringify({ ids, data }) 
    });
    return response.data;
  }

  async bulkDeleteCompanies(ids: string[]) {
    const response = await this.request('/companies/bulk', { 
      method: 'DELETE', 
      body: JSON.stringify({ ids }) 
    });
    return response.data;
  }

  // PDF generation
  async generateCompanyPDF(companyId: string) {
    const response = await fetch(`${this.baseUrl}/pdf/company/${companyId}`, {
      headers: this.getHeaders()
    });
    return response.blob();
  }

  async generateTasksPDF(userId?: string) {
    const url = userId ? `/pdf/tasks?userId=${userId}` : '/pdf/tasks';
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: this.getHeaders()
    });
    return response.blob();
  }

  // Profile change requests methods
  async getMyProfileChangeRequests() {
    const response = await this.request('/profile-changes/my-requests');
    return response.data;
  }

  async requestProfileChange(changes: { full_name?: string; email?: string; region?: string }) {
    const response = await this.request('/profile-changes/request', {
      method: 'POST',
      body: JSON.stringify(changes)
    });
    return response.data;
  }

  async cancelProfileChangeRequest(requestId: string) {
    const response = await this.request(`/profile-changes/request/${requestId}`, { method: 'DELETE' });
    return response.data;
  }

  async getAdminPendingProfileChanges() {
    const response = await this.request('/profile-changes/admin/pending');
    return response.data;
  }

  async getAllAdminProfileChanges(status?: string) {
    const url = status ? `/profile-changes/admin/all?status=${status}` : '/profile-changes/admin/all';
    const response = await this.request(url);
    return response.data;
  }

  async approveProfileChange(requestId: string) {
    const response = await this.request(`/profile-changes/admin/approve/${requestId}`, { method: 'POST' });
    return response.data;
  }

  async rejectProfileChange(requestId: string, reason?: string) {
    const response = await this.request(`/profile-changes/admin/reject/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return response.data;
  }

  // Session Management
  async getSessions() {
    const response = await this.request('/sessions');
    return response;
  }

  async terminateSession(sessionId: string) {
    const response = await this.request(`/sessions/${sessionId}`, { method: 'DELETE' });
    return response;
  }

  async terminateAllOtherSessions() {
    const response = await this.request('/sessions/others/all', { method: 'DELETE' });
    return response;
  }

  // Audit Logs
  async getAuditLogs(page: number = 1, limit: number = 50, filters?: { action?: string; entityType?: string; userId?: string }) {
    let url = `/audit-logs?page=${page}&limit=${limit}`;
    if (filters?.action) url += `&action=${filters.action}`;
    if (filters?.entityType) url += `&entity_type=${filters.entityType}`;
    if (filters?.userId) url += `&user_id=${filters.userId}`;
    const response = await this.request(url);
    return this.normalizeListResponse(response);
  }
}

export const apiClient = new ApiClient();