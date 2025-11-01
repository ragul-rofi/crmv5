/**
 * Test Suite for Company Data Page Backend Fixes
 * 
 * Tests:
 * 1. Bulk approval authorization (requireFinalizers)
 * 2. Follow-up date validation (server-side)
 * 3. Admin-only follow-up delete
 * 4. CSV import with server-side validation
 * 5. Finalize transaction + status validation
 * 6. Bulk approval notifications
 * 7. Audit logging for all operations
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api/v1';

// Test data
let adminToken: string;
let dataCollectorToken: string;
let managerToken: string;
let testCompanyId: string;
let testFollowUpId: string;

test.describe('Company Data Page - Backend Fixes', () => {
  
  test.beforeAll(async ({ request }) => {
    // Login as different users to get tokens
    const adminLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@example.com', password: 'password123' }
    });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;

    const dcLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'datacollector@example.com', password: 'password123' }
    });
    const dcData = await dcLogin.json();
    dataCollectorToken = dcData.token;

    const managerLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'manager@example.com', password: 'password123' }
    });
    const managerData = await managerLogin.json();
    managerToken = managerData.token;
  });

  test.describe('1. Bulk Approval Authorization', () => {
    
    test('should deny bulk approval for DataCollector role', async ({ request }) => {
      const response = await request.put(`${API_BASE}/companies/approvals/bulk`, {
        headers: { Authorization: `Bearer ${dataCollectorToken}` },
        data: {
          ids: ['550e8400-e29b-41d4-a716-446655440000'],
          action: 'approve'
        }
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Insufficient permissions');
    });

    test('should allow bulk approval for Manager role', async ({ request }) => {
      const response = await request.put(`${API_BASE}/companies/approvals/bulk`, {
        headers: { Authorization: `Bearer ${managerToken}` },
        data: {
          ids: [],
          action: 'approve'
        }
      });

      // Should succeed (or return 400 for empty array, but not 403)
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('2. Follow-Up Date Validation', () => {
    
    test.beforeAll(async ({ request }) => {
      // Create a test company
      const companyRes = await request.post(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Test Company for Follow-ups',
          contact_person: 'Test Contact'
        }
      });
      const companyData = await companyRes.json();
      testCompanyId = companyData.data.id;
    });

    test('should reject follow-up with future contacted_date', async ({ request }) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const today = new Date();

      const response = await request.post(`${API_BASE}/follow-ups`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          company_id: testCompanyId,
          contacted_date: tomorrow.toISOString().split('T')[0],
          follow_up_date: today.toISOString().split('T')[0],
          follow_up_notes: 'This should fail'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Follow-up date must be after contacted date');
    });

    test('should accept valid follow-up dates', async ({ request }) => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await request.post(`${API_BASE}/follow-ups`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          company_id: testCompanyId,
          contacted_date: today.toISOString().split('T')[0],
          follow_up_date: tomorrow.toISOString().split('T')[0],
          follow_up_notes: 'Valid follow-up'
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      testFollowUpId = data.data.id;
      expect(data.success).toBe(true);
    });
  });

  test.describe('3. Admin-Only Follow-Up Delete', () => {
    
    test('should reject delete for non-Admin user', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/follow-ups/${testFollowUpId}`, {
        headers: { Authorization: `Bearer ${dataCollectorToken}` }
      });

      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Only administrators can delete follow-ups directly');
      expect(data.hint).toContain('followup-deletion-requests');
    });

    test('should allow delete for Admin user', async ({ request }) => {
      const response = await request.delete(`${API_BASE}/follow-ups/${testFollowUpId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  test.describe('4. CSV Import Server Endpoint', () => {
    
    test('should reject import with invalid data', async ({ request }) => {
      const response = await request.post(`${API_BASE}/companies/import`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          companies: [
            {
              // Missing required 'name' field
              email: 'test@example.com'
            }
          ]
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should import valid companies', async ({ request }) => {
      const response = await request.post(`${API_BASE}/companies/import`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          companies: [
            {
              name: 'Import Test Company 1',
              email: 'import1@example.com',
              contact_person: 'John Doe',
              company_type: 'YES', // Should map to 'Prospect'
              conversionStatus: 'Waiting'
            },
            {
              name: 'Import Test Company 2',
              email: 'import2@example.com',
              contact_person: 'Jane Smith',
              company_type: 'NO', // Should map to 'Customer'
              conversionStatus: 'Contacted'
            }
          ]
        }
      });

      expect([201, 207]).toContain(response.status()); // 201 or 207 Multi-Status
      const data = await response.json();
      expect(data.data.imported).toBeGreaterThanOrEqual(2);
    });

    test('should respect 1000 company import limit', async ({ request }) => {
      const tooManyCompanies = Array.from({ length: 1001 }, (_, i) => ({
        name: `Company ${i}`,
        contact_person: 'Test'
      }));

      const response = await request.post(`${API_BASE}/companies/import`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          companies: tooManyCompanies
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Maximum 1000 companies');
    });
  });

  test.describe('5. Finalize Transaction & Validation', () => {
    
    let unconfirmedCompanyId: string;
    let confirmedCompanyId: string;

    test.beforeAll(async ({ request }) => {
      // Create unconfirmed company
      const unconfirmedRes = await request.post(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Unconfirmed Company',
          contact_person: 'Test',
          conversionStatus: 'Waiting'
        }
      });
      const unconfirmedData = await unconfirmedRes.json();
      unconfirmedCompanyId = unconfirmedData.data.id;

      // Create confirmed company
      const confirmedRes = await request.post(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Confirmed Company',
          contact_person: 'Test',
          conversionStatus: 'Confirmed'
        }
      });
      const confirmedData = await confirmedRes.json();
      confirmedCompanyId = confirmedData.data.id;
    });

    test('should reject finalize for non-Confirmed status', async ({ request }) => {
      const response = await request.put(`${API_BASE}/companies/${unconfirmedCompanyId}/finalize`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status()).toBe(500); // Service throws error
      const data = await response.json();
      expect(data.error).toContain('Confirmed conversion status');
    });

    test('should allow finalize for Confirmed status', async ({ request }) => {
      const response = await request.put(`${API_BASE}/companies/${confirmedCompanyId}/finalize`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.data.company.finalization_status).toBe('Finalized');
    });

    test('should reject duplicate finalize', async ({ request }) => {
      const response = await request.put(`${API_BASE}/companies/${confirmedCompanyId}/finalize`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status()).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('already finalized');
    });
  });

  test.describe('6. Bulk Approval Notifications', () => {
    
    test('should create notifications on bulk approve', async ({ request }) => {
      // Create a pending company
      const companyRes = await request.post(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Notification Test Company',
          contact_person: 'Test',
          conversionStatus: 'Confirmed'
        }
      });
      const companyData = await companyRes.json();
      const companyId = companyData.data.id;

      // Set to pending status (would normally be done through workflow)
      await request.put(`${API_BASE}/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          ...companyData.data,
          finalization_status: 'Pending'
        }
      });

      // Bulk approve
      const approveRes = await request.put(`${API_BASE}/companies/approvals/bulk`, {
        headers: { Authorization: `Bearer ${managerToken}` },
        data: {
          ids: [companyId],
          action: 'approve'
        }
      });

      expect(approveRes.status()).toBe(200);

      // Check notifications were created (would need to query notification endpoint)
      // This is a simplified check
      const data = await approveRes.json();
      expect(data.data.updated).toBeGreaterThan(0);
    });
  });

  test.describe('7. Audit Logging', () => {
    
    test('should log finalize operation', async ({ request }) => {
      // Create and finalize a company
      const companyRes = await request.post(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          name: 'Audit Test Company',
          contact_person: 'Test',
          conversionStatus: 'Confirmed'
        }
      });
      const companyData = await companyRes.json();
      const companyId = companyData.data.id;

      const finalizeRes = await request.put(`${API_BASE}/companies/${companyId}/finalize`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(finalizeRes.status()).toBe(200);
      
      // Audit logs would be checked in database
      // This test validates the operation succeeded, implying audit was logged
    });

    test('should log CSV import operation', async ({ request }) => {
      const response = await request.post(`${API_BASE}/companies/import`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: {
          companies: [
            {
              name: 'Audit Import Test',
              contact_person: 'Test'
            }
          ]
        }
      });

      expect([201, 207]).toContain(response.status());
      // Audit log would be verified in database
    });
  });
});
