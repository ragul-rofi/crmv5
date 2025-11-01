# Field Mapping Reference - CRM Company Data

## Overview
This document maps the **UI labels** to their **database column names** and explains the purpose of each field in the placement-focused CRM system.

---

## 📊 Company Information Fields

| UI Label (Form) | Database Column | Data Type | Purpose | Example Value |
|----------------|----------------|-----------|---------|---------------|
| **Company Name*** | `name` | VARCHAR(255) | Legal name of the company | "Tech Innovations Pvt Ltd" |
| **Job Description** | `notes` | TEXT | Description of job roles offered | "Hiring Full Stack Developers for AI projects" |
| **Eligible Departments** | `industry` | VARCHAR(100) | Academic departments eligible for placement | "B.E. / B.Tech, MCA" |
| **Student Batch** | `employee_count` | VARCHAR(50) | Student batch code (e.g., C26 = 2026 batch) | "C26", "C27", "C28" |
| **Company Size** | `annual_revenue` | DECIMAL(15,2) | Number of employees in the company | 250, 500, 1000 |
| **Company Contact*** | `contact_person` | VARCHAR(255) | Primary HR contact person | "Rajesh Kumar" |
| **Company Email** | `email` | VARCHAR(255) | Official company email | "hr@techcompany.com" |
| **Company Location** | `address` | TEXT | Company office address | "123 MG Road, Bangalore, Karnataka" |
| **Salary (LPA)** | `rating` | DECIMAL(10,2) | Annual salary in Lakhs Per Annum | 12.5, 15.0, 18.75 |
| **Service Agreement** | `company_type` | VARCHAR(10) | Service agreement status | "YES" or "NO" |
| **Conversion Status** | `conversion_status` | VARCHAR(50) | Stage in conversion pipeline | "Waiting", "Contacted", "Confirmed" |
| **Data Added by** | `assigned_data_collector_id` | UUID | User who created the company record | (auto-filled) |

\* Required fields

---

## 🎯 Field Purpose Explanations

### 1. **Student Batch** (`employee_count`)
- **Original Purpose**: Number of employees
- **Repurposed For**: Student batch identification
- **Format**: Text codes like "C26" (Class of 2026), "C27" (Class of 2027)
- **Storage**: VARCHAR to support non-numeric codes
- **Use Case**: Filtering companies by graduation year eligibility

### 2. **Company Size** (`annual_revenue`)
- **Original Purpose**: Annual revenue in dollars
- **Repurposed For**: Number of employees
- **Format**: Numeric (integer or decimal)
- **Storage**: DECIMAL(15,2) for flexibility
- **Use Case**: Categorizing companies (startup, mid-size, enterprise)

### 3. **Salary (LPA)** (`rating`)
- **Original Purpose**: Company rating (1-5 stars)
- **Repurposed For**: Salary package offered
- **Format**: Decimal number representing Lakhs Per Annum
- **Storage**: DECIMAL(10,2) for precise amounts
- **Use Case**: Salary filtering and reporting (e.g., ₹12.5 LPA = 12.5 lakhs/year)

### 4. **Service Agreement** (`company_type`)
- **Original Purpose**: Company type (Prospect, Customer, etc.)
- **Repurposed For**: Service agreement status
- **Format**: "YES" or "NO"
- **Storage**: VARCHAR(10)
- **Use Case**: Tracking which companies have signed agreements

### 5. **Job Description** (`notes`)
- **Original Purpose**: General notes about company
- **Repurposed For**: Detailed job role descriptions
- **Format**: Free-form text (multi-line)
- **Storage**: TEXT (unlimited length)
- **Use Case**: Students can view job requirements before applying

### 6. **Eligible Departments** (`industry`)
- **Original Purpose**: Industry sector (Technology, Finance, etc.)
- **Repurposed For**: Academic department eligibility
- **Format**: Comma-separated list of departments
- **Options**:
  - B.E. / B.Tech
  - MBA
  - MCA
  - PRO - B.Sc
  - INTELLECT - Science
  - INTELLECT - Engg
  - INTELLECT - MBA
- **Storage**: VARCHAR(100)
- **Use Case**: Filtering companies by student's department

---

## 📇 Contact Information Fields

| UI Label (Form) | Database Table | Column | Data Type | Purpose |
|----------------|----------------|--------|-----------|---------|
| **Contact Person Name** | `contact_persons` | `name` | VARCHAR(255) | HR contact name |
| **Contact Person Mobile** | `contact_persons` | `phone` | VARCHAR(20) | Mobile number |
| **Contact Person Email** | `contact_persons` | `email` | VARCHAR(255) | Email address |

- **Relationship**: One-to-Many (1 company → multiple contacts)
- **Foreign Key**: `contact_persons.company_id` → `companies.id`
- **Unlimited**: Yes, can add as many contacts as needed

---

## 🔄 Conversion Status Values

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **Waiting** | Company added, not yet contacted | Data Collector → Converter assigns |
| **NoReach** | Unable to reach company | Retry contacting |
| **Contacted** | Initial contact made | Follow-up scheduled |
| **Negotiating** | Terms being discussed | Finalize agreement |
| **Confirmed** | Company confirmed for placement | Send for approval |

---

## ✅ Approval Workflow Stages

| Stage | Database Value | Approver Role | Next Stage |
|-------|---------------|---------------|------------|
| **Pending** | `Pending` | - | ConverterApproved |
| **Converter Approved** | `ConverterApproved` | Converter | ManagerApproved |
| **Manager Approved** | `ManagerApproved` | Manager | Finalized |
| **Finalized** | `Finalized` | Head/SubHead/Admin | (End state) |

---

## 🚀 CSV Import Template Format

### Template Columns (in order):
```csv
name,email,address,notes,industry,employee_count,annual_revenue,contact_person,rating,company_type,conversionStatus
```

### Sample Data Row:
```csv
"Sample Tech Corp","contact@sampletechcorp.com","123 Tech Park, Phase 2, Electronic City, Bangalore, Karnataka 560100, India","Hiring for Software Development roles in AI and Machine Learning","B.E. / B.Tech, MCA","C26",250,"Priya Sharma",12.5,"YES","Confirmed"
```

### Field Notes:
- `employee_count`: Use text codes ("C26", "C27"), not numbers
- `annual_revenue`: Enter number of employees (250, 500)
- `rating`: Enter salary in LPA (12.5, 15.0)
- `company_type`: Use "YES" or "NO" (case-sensitive)
- `conversionStatus`: Use exact status names (Waiting, Contacted, Confirmed, etc.)

---

## 🗄️ Database Schema Summary

```sql
-- Core company fields (updated for placement tracking)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,                        -- Company Name
  email VARCHAR(255),                                -- Company Email
  address TEXT,                                      -- Company Location
  notes TEXT,                                        -- Job Description
  industry VARCHAR(100),                             -- Eligible Departments
  employee_count VARCHAR(50),                        -- Student Batch (text: "C26")
  annual_revenue DECIMAL(15,2),                      -- Company Size (employees)
  contact_person VARCHAR(255),                       -- Company Contact
  rating DECIMAL(10,2),                              -- Salary (LPA)
  company_type VARCHAR(10),                          -- Service Agreement (YES/NO)
  conversion_status VARCHAR(50),                     -- Conversion Status
  finalization_status VARCHAR(50),                   -- Finalization Status
  approval_stage VARCHAR(30),                        -- Approval Workflow Stage
  assigned_data_collector_id UUID REFERENCES users(id), -- Data Added by
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact persons (unlimited per company)
CREATE TABLE contact_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255),                                 -- Contact Person Name
  phone VARCHAR(20),                                 -- Contact Person Mobile
  email VARCHAR(255),                                -- Contact Person Email
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 Query Examples

### Get company with all fields (placement view):
```sql
SELECT 
  name AS "Company Name",
  notes AS "Job Description",
  industry AS "Eligible Departments",
  employee_count AS "Student Batch",
  annual_revenue AS "Company Size",
  contact_person AS "Company Contact",
  email AS "Company Email",
  address AS "Company Location",
  rating AS "Salary (LPA)",
  company_type AS "Service Agreement",
  conversion_status AS "Conversion Status"
FROM companies 
WHERE id = 'company-uuid-here';
```

### Get all contacts for a company:
```sql
SELECT 
  name AS "Contact Person Name",
  phone AS "Contact Person Mobile",
  email AS "Contact Person Email"
FROM contact_persons 
WHERE company_id = 'company-uuid-here'
ORDER BY created_at;
```

### Filter by student batch:
```sql
SELECT * FROM companies 
WHERE employee_count = 'C26'  -- Students graduating in 2026
ORDER BY created_at DESC;
```

### Filter by salary range:
```sql
SELECT * FROM companies 
WHERE rating >= 10.0 AND rating <= 15.0  -- 10-15 LPA
ORDER BY rating DESC;
```

---

## ⚠️ Important Notes

### 1. **employee_count is VARCHAR, not INTEGER**
- ❌ **Wrong**: `employee_count: 26` (number)
- ✅ **Correct**: `employee_count: "C26"` (string)
- **Reason**: Supports batch codes like "C26", "C27", not just counts

### 2. **annual_revenue is Company Size, not Revenue**
- ❌ **Wrong**: Annual revenue in dollars/rupees
- ✅ **Correct**: Number of employees (250, 500, 1000)

### 3. **rating is Salary, not Rating**
- ❌ **Wrong**: 1-5 star rating
- ✅ **Correct**: Salary in Lakhs Per Annum (12.5 = ₹12.5 LPA)

### 4. **company_type is YES/NO, not Prospect/Customer**
- ❌ **Wrong**: "Prospect", "Customer", "Partner"
- ✅ **Correct**: "YES" or "NO" (service agreement signed?)

### 5. **Contact Persons are Separate Table**
- Cannot store multiple contacts in company row
- Must use `contact_persons` table with `company_id` foreign key
- Can add unlimited contacts per company

---

## 🎯 UI Display Rules

### Company Information Card (Detail Page):
```typescript
// Display format for each field
{
  "Company Name": company.name,
  "Job Description": company.notes || "N/A",
  "Eligible Departments": company.industry || "N/A",
  "Student Batch": company.employee_count || "N/A",
  "Company Size": company.annual_revenue ? `${company.annual_revenue} employees` : "N/A",
  "Company Contact": company.contact_person || "N/A",
  "Company Email": company.email || "N/A",
  "Company Location": company.address || "N/A",
  "Salary (LPA)": company.rating ? `₹${company.rating}` : "N/A",
  "Service Agreement": company.company_type || "N/A",
  "Conversion Status": <Badge>{company.conversion_status}</Badge>
}
```

### Table Columns (Data Page):
- Checkbox (for multi-select)
- Company Name (clickable link)
- Email
- Address
- Conversion Status (badge)
- Finalization Status (badge)
- Added By (user name from `assigned_data_collector_id`)
- Actions (edit/delete/finalize)

---

## 📚 Related Documentation

- `IMPLEMENTATION_SUMMARY.md` - Complete list of changes made
- `VALIDATION_CHECKLIST.md` - Testing checklist for all features
- `REDIS_CACHING.md` - Redis removal notes (now deprecated)
- `database/schema.sql` - Full database schema
- `database/migrations/007_add_approval_workflow.sql` - Approval workflow migration

---

## 🆘 Troubleshooting

### Issue: CSV import fails with type error on employee_count
**Solution**: Ensure CSV has text values ("C26"), not numbers (26)

### Issue: Company Size showing as currency
**Solution**: Update display to show "{value} employees", not "₹{value}"

### Issue: Salary not showing ₹ symbol
**Solution**: Format in UI as `₹${company.rating}`, not raw number

### Issue: Multiple contacts not saving
**Solution**: Check `contact_persons` table for foreign key constraint errors

### Issue: Service Agreement showing "Prospect"
**Solution**: Database still has old values; update to "YES" or "NO"

---

**Last Updated**: After Company Data Page redesign implementation  
**Status**: ✅ All fields mapped and documented
