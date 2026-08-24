# RentSphere – Smart Property and Rental Management System

Base URL:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger/index.html
```

Authentication:

- Public endpoints: `/auth/**`
- Protected endpoints: all other endpoints
- Token format after login: `Authorization: Bearer <jwt-token>`
- JWT includes the user role and is used for method-level authorization.

Note: Login returns a JWT token. Send that token in the `Authorization` header when calling protected module endpoints.

Role access:

```text
ADMIN       -> organizations, users, roles, and all organization management modules
OWNER       -> buildings, units, properties, tenants, agreements, payments, invoices, complaints, deposit disputes, rent increases, approvals
TENANT      -> browse/apply; read properties, buildings, units, complaints, deposit disputes, and rent increases; create complaints and deposit disputes
```

Tenant accounts cannot delete shared records. Rent increases are created and deleted by owners or administrators; tenants may update a rent increase to record their response.

## Backend Architecture

The backend now follows a layered Spring Boot structure:

```text
Controller
  -> Service
  -> Repository
  -> JPA Entity
  -> PostgreSQL table
```

Responsibilities:

- Controllers handle HTTP routes, validation, and response status codes.
- Services handle business rules, updates, password hashing, and transaction boundaries.
- Repositories handle database access through Spring Data JPA.
- `GlobalExceptionHandler` converts errors into consistent JSON responses.
- `JwtAuthenticationFilter` validates Bearer tokens for protected endpoints.
- Swagger/OpenAPI is configured with JWT Bearer authentication support.
- Module list endpoints also support pagination at `/paged`.
- Approval decisions trigger email notifications when SMTP is enabled.

Standard error response:

```json
{
  "timestamp": "2026-06-28T20:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/organizations",
  "validationErrors": {
    "name": "must not be blank"
  }
}
```

## Auth Module

### Register User

```http
POST /auth/register
```

Creates a new user account.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "organizationId": "00000000-0000-0000-0000-000000000000",
  "role": "TENANT"
}
```

Allowed roles:

```text
TENANT
```

Registration policy:

```text
TENANT  -> self-registration allowed
ADMIN   -> only the very first account (bootstrap); afterwards created via /users by an administrator
OWNER   -> always created via /users by an administrator (403 on self-registration)
```

Success response:

```text
User registered successfully
```

Success status:

```text
201 Created
```

Backend flow:

```text
AuthController.register
  -> RegisterRequest
  -> AuthService.register
  -> duplicate email check
  -> BCrypt password encoding
  -> User entity
  -> UserRepository.save
  -> users table
```

### Login User

```http
POST /auth/login
```

Authenticates a user and returns a JWT token.

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "token": "jwt-token-value"
}
```

Error cases:

```text
Invalid email or password
```

Backend flow:

```text
AuthController.login
  -> LoginRequest
  -> AuthService.login
  -> UserRepository.findByEmail
  -> BCrypt password match
  -> JwtService.generateToken
  -> AuthResponse
```

## Profile & Password Module

Status: Implemented.

Endpoints (require a valid Bearer token):

```http
GET  /auth/me
PUT  /auth/me
POST /auth/change-password
```

### Get Current Profile

```http
GET /auth/me
```

Returns the current user's id, name, email, phone, role, organizationId, and createdAt.

### Update Current Profile

```http
PUT /auth/me
```

Request body:

```json
{
  "name": "Jane Doe",
  "phone": "9876543210"
}
```

### Change Password

```http
POST /auth/change-password
```

Request body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-8-chars-min"
}
```

Error cases:

```text
Invalid email or password (current password does not match)  -> 401
Validation failed (new password too short)                    -> 400
```

## User Module

Status: Implemented.

Table: `users`

Endpoints:

```http
GET    /users
GET    /users/paged?page=0&size=20
GET    /users/{id}
PUT    /users/{id}
DELETE /users/{id}
```

## Applications & Approvals Module

Status: Implemented.

Table: `approval_requests`

Access:

```text
ADMIN
OWNER
```

Email behavior:

- Creating an approval sends an email to `approverEmail`.
- Approving or rejecting sends an email to `requesterEmail`.
- If `MAIL_ENABLED=false`, the API still works and logs that email was skipped.

### Create Approval Request

```http
POST /approvals
```

Request body:

```json
{
  "organizationId": "00000000-0000-0000-0000-000000000000",
  "type": "RENTAL_AGREEMENT",
  "subject": "Approve rental agreement for Unit A-101",
  "details": "Tenant has submitted documents and deposit confirmation.",
  "requesterEmail": "owner@example.com",
  "approverEmail": "admin@example.com"
}
```

Success status:

```text
201 Created
```

### List Approval Requests

```http
GET /approvals
GET /approvals?status=PENDING
GET /approvals?status=APPROVED
GET /approvals?status=REJECTED
```

### Get Approval Request

```http
GET /approvals/{id}
```

### Approve Request

```http
POST /approvals/{id}/approve
```

Request body:

```json
{
  "comment": "Approved after document verification."
}
```

### Reject Request

```http
POST /approvals/{id}/reject
```

Request body:

```json
{
  "comment": "Rejected because ID proof is missing."
}
```

SMTP configuration:

```text
MAIL_ENABLED=true
MAIL_FROM=noreply@yourdomain.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

## Organization Module

Status: Implemented.

Table: `organizations`

Endpoints:

```http
POST   /organizations
GET    /organizations
GET    /organizations/paged?page=0&size=20
GET    /organizations/{id}
PUT    /organizations/{id}
DELETE /organizations/{id}
```

## Property Module

Status: Implemented.

Table: `properties`

Endpoints:

```http
POST   /properties
GET    /properties
GET    /properties/paged?page=0&size=20
GET    /properties/{id}
PUT    /properties/{id}
DELETE /properties/{id}
```

SaaS fields include property details, location, photos, and amenities.

## Building Module

Status: Implemented.

Table: `buildings`

Endpoints:

```http
POST   /buildings
GET    /buildings
GET    /buildings/paged?page=0&size=20
GET    /buildings/{id}
PUT    /buildings/{id}
DELETE /buildings/{id}
```

## Unit Module

Status: Implemented.

Table: `units`

Endpoints:

```http
POST   /units
GET    /units
GET    /units/paged?page=0&size=20
GET    /units/{id}
PUT    /units/{id}
DELETE /units/{id}
```

Allowed unit statuses:

```text
AVAILABLE
OCCUPIED
MAINTENANCE
```

## Tenant Module

Status: Implemented.

Table: `tenants`

Endpoints:

```http
POST   /tenants
GET    /tenants
GET    /tenants/paged?page=0&size=20
GET    /tenants/{id}
PUT    /tenants/{id}
DELETE /tenants/{id}
```

SaaS fields include tenant profile details, assigned unit, emergency contact, KYC status, ID proof URL, and address proof URL.

## Agreement Module

Status: Implemented.

Table: `agreements`

Endpoints:

```http
POST   /agreements
GET    /agreements
GET    /agreements/paged?page=0&size=20
GET    /agreements/{id}
PUT    /agreements/{id}
DELETE /agreements/{id}
```

Allowed agreement statuses:

```text
ACTIVE
EXPIRED
TERMINATED
```

## Invoice Module

Status: Implemented.

Table: `invoices`

Endpoints:

```http
POST   /invoices
GET    /invoices
GET    /invoices/paged?page=0&size=20
GET    /invoices/{id}
PUT    /invoices/{id}
DELETE /invoices/{id}
```

Allowed invoice statuses:

```text
PENDING
PAID
OVERDUE
```

## Payment Module

Status: Implemented.

Table: `payments`

Endpoints:

```http
POST   /payments
GET    /payments
GET    /payments/paged?page=0&size=20
GET    /payments/{id}
PUT    /payments/{id}
DELETE /payments/{id}
```

Allowed payment statuses:

```text
PENDING
SUCCESS
FAILED
```

## Complaints & Maintenance Module

Status: Implemented.

Table: `complaints`

Endpoints:

```http
POST   /complaints
GET    /complaints
GET    /complaints/paged?page=0&size=20
GET    /complaints/{id}
PUT    /complaints/{id}
DELETE /complaints/{id}
```

Allowed complaint statuses:

```text
OPEN
IN_PROGRESS
RESOLVED
```

## Deposit Dispute Module

Status: Implemented.

Table: `deposit_disputes`

Purpose:

- Track advance/security deposit amount and claimed deductions.
- Upload evidence such as move-in photos, move-out photos, bills, or repair quotes through an evidence URL/file preview.
- Compare owner repair estimates with market repair estimates.
- Record proposed digital settlement amount and settlement due date.

Endpoints:

```http
POST   /deposit-disputes
GET    /deposit-disputes
GET    /deposit-disputes/paged?page=0&size=20
GET    /deposit-disputes/{id}
PUT    /deposit-disputes/{id}
DELETE /deposit-disputes/{id}
```

Request body:

```json
{
  "organizationId": "00000000-0000-0000-0000-000000000000",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "unitId": "00000000-0000-0000-0000-000000000000",
  "agreementId": "00000000-0000-0000-0000-000000000000",
  "depositAmount": 50000,
  "deductedAmount": 12000,
  "ownerRepairEstimate": 12000,
  "marketRepairEstimate": 6500,
  "proposedSettlementAmount": 7000,
  "deductionReason": "Wall repainting and deep cleaning",
  "evidenceUrl": "https://example.com/deposit-evidence.jpg",
  "tenantNotes": "Photos show normal wear and tear",
  "ownerResponse": "Owner uploaded repair quote",
  "settlementDueDate": "2027-01-20",
  "status": "UNDER_REVIEW"
}
```

Allowed deposit dispute statuses:

```text
OPEN
EVIDENCE_PENDING
UNDER_REVIEW
SETTLEMENT_PROPOSED
SETTLED
REJECTED
```

## Rent Increase Module

Status: Implemented.

Table: `rent_increases`

Purpose:

- Track old and proposed rent values so the frontend can show a rent history graph.
- Record notice date, effective date, and scheduled notification time before the increase starts.
- Capture tenant response and owner notes when an unexpected rent increase becomes a conflict.

Endpoints:

```http
POST   /rent-increases
GET    /rent-increases
GET    /rent-increases/paged?page=0&size=20
GET    /rent-increases/{id}
PUT    /rent-increases/{id}
DELETE /rent-increases/{id}
```

Request body:

```json
{
  "organizationId": "00000000-0000-0000-0000-000000000000",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "unitId": "00000000-0000-0000-0000-000000000000",
  "agreementId": "00000000-0000-0000-0000-000000000000",
  "previousRent": 18500,
  "proposedRent": 21000,
  "increaseAmount": 2500,
  "increasePercent": 13.5,
  "noticeDate": "2027-02-01",
  "effectiveDate": "2027-04-01",
  "notificationScheduledAt": "2027-02-01T09:00:00",
  "notificationSentAt": null,
  "reason": "Annual rent revision",
  "tenantResponse": "Tenant requested review before accepting",
  "ownerNotes": "Notification scheduled 60 days before effective date",
  "status": "NOTICE_SCHEDULED"
}
```

Allowed rent increase statuses:

```text
DRAFT
NOTICE_SCHEDULED
NOTIFIED
TENANT_REVIEW
ACCEPTED
DISPUTED
CANCELLED
```
