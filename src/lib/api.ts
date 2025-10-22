const API_URL = import.meta.env.VITE_API_URL;

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: { email: string; password: string; full_name: string; role?: string }) {
    return this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Companies
  async getCompanies() {
    return this.request<any[]>('/companies');
  }

  async getCompany(id: string) {
    return this.request<any>(`/companies/${id}`);
  }

  async createCompany(data: any) {
    return this.request<any>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: any) {
    return this.request<any>(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string) {
    return this.request<any>(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  async finalizeCompany(id: string) {
    return this.request<any>(`/companies/${id}/finalize`, {
      method: 'PUT',
    });
  }

  async getFinalizedCompanies() {
    return this.request<any[]>('/companies/finalized/list');
  }

  // Contacts
  async getContacts() {
    return this.request<any[]>('/contacts');
  }

  async createContact(data: any) {
    return this.request<any>('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: any) {
    return this.request<any>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string) {
    return this.request<any>(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks() {
    return this.request<any[]>('/tasks');
  }

  async createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Tickets
  async getTickets() {
    return this.request<any[]>('/tickets');
  }

  async createTicket(data: any) {
    return this.request<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: string, data: any) {
    return this.request<any>(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTicket(id: string) {
    return this.request<any>(`/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async getUsersList() {
    return this.request<any[]>('/users/list');
  }

  async getUser(id: string) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Custom Fields
  async getCustomFields() {
    return this.request<any[]>('/custom-fields');
  }

  async createCustomField(data: any) {
    return this.request<any>('/custom-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomField(id: string) {
    return this.request<any>(`/custom-fields/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async createNotification(data: { userId: string; message: string }) {
    return this.request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id: string) {
    return this.request<any>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(companyId: string) {
    return this.request<any[]>(`/comments/company/${companyId}`);
  }

  async createComment(data: { content: string; company_id: string; parent_comment_id?: string }) {
    return this.request<any>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(id: string, content: string) {
    return this.request<any>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(id: string) {
    return this.request<any>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
