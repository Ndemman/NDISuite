# NDISuite Authentication Implementation Plan

This document outlines the development plan for implementing advanced authentication features in the NDISuite Report Generator application.

## Overview

The authentication system will support:
- [x] Signup process for new user accounts
- [x] Hierarchical account structure:
  - [x] Parent accounts (Business/Organization administrators)
  - [x] Child accounts (Staff with limited permissions)
  - [x] Lone accounts (Individual practitioners)
- [x] Password recovery and management

## 1. Backend Implementation

### 1.1. Update User Model
- [x] Extend the existing User model in `backend/users/models.py`:
  - [x] Add account type field (PARENT, CHILD, LONE)
  - [x] Add parent-child relationship field (Foreign Key)
  - [x] Add permission/role fields
  - [x] Add account verification fields
  - [x] Add organization profile fields

```python
class User(AbstractUser):
    # Existing fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    organization = models.CharField(max_length=255, blank=True)
    job_title = models.CharField(max_length=255, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    
    # New fields
    ACCOUNT_TYPES = [
        ('PARENT', 'Parent Account'),
        ('CHILD', 'Child Account'),
        ('LONE', 'Individual Account'),
    ]
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES, default='LONE')
    parent_account = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='child_accounts')
    
    # Permission fields
    can_manage_users = models.BooleanField(default=False)
    can_manage_billing = models.BooleanField(default=False)
    can_export_reports = models.BooleanField(default=True)
    
    # Verification
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, blank=True, null=True)
    verification_token_created = models.DateTimeField(null=True, blank=True)
    
    # Password reset fields
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_token_created = models.DateTimeField(null=True, blank=True)
```

### 1.2. Create User Serializers
- [x] Create serializers in `backend/users/serializers.py`:
  - [x] User creation serializer
  - [x] User profile serializer
  - [x] User management serializer (for parent accounts)
  - [x] Password reset serializers

### 1.3. Implement Authentication Views
- [x] Update `backend/users/views.py` with new views:
  - [x] Registration view for new accounts
  - [x] Email verification view
  - [x] User management views (create/update/delete child accounts)
  - [x] Password reset request view
  - [x] Password reset confirmation view

### 1.4. Configure Email Backend
- [x] Set up email functionality in Django settings
- [x] Create email templates for:
  - [x] Account verification
  - [x] Password reset
  - [x] New child account notification

### 1.5. Update API Endpoints
- [x] Update `backend/users/urls.py` with new endpoints:

```python
urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('child-accounts/', ChildAccountListView.as_view(), name='child_account_list'),
    path('child-accounts/create/', CreateChildAccountView.as_view(), name='create_child_account'),
]
```

## 2. Frontend Implementation

### 2.1. Create Authentication Components
- [x] Create reusable components in `frontend/src/components/auth/`:
  - [x] AuthForm.tsx (base component for auth forms)
  - [x] AccountTypeSelector.tsx (for registration)
  - [x] PasswordField.tsx (with strength indicator)
  - [x] VerificationMessage.tsx

### 2.2. Implement Authentication Pages
- [x] Create/update pages in `frontend/src/pages/auth/`:
  - [x] register.tsx (signup form) - updated to support account types
  - [x] verify-email.tsx (email verification page)
  - [x] password-reset.tsx (request form)
  - [x] password-reset-confirm.tsx (new password form)
  - [x] Update existing login.tsx (add forgot password link)

### 2.3. User Management Pages
- [x] Create pages for parent account user management:
  - [x] pages/settings/users/index.tsx (list users)
  - [x] pages/settings/users/new.tsx (add child user)
  - [x] pages/settings/users/[id].tsx (edit child user)

### 2.4. Update Authentication Service
- [x] Enhance `frontend/src/api/authService.ts` with new methods:
  - [x] register (with account type selection)
  - [x] verifyEmail 
  - [x] requestPasswordReset
  - [x] confirmPasswordReset
  - [x] createChildAccount (via fetch API)
  - [x] updateUser (via fetch API)
  - [x] deleteUser (via fetch API)

## 3. Permission Controls

### 3.1. Backend Permission System
- [x] Create custom permission classes in `backend/users/views.py`:
  - [x] IsParentAccount
  - [x] IsAccountOwnerOrParent
  - [x] Permission checks in viewset methods

### 3.2. Frontend Permission Controls
- [x] Create permission checks in components:
  - [x] Guards for restricted routes in user management pages
  - [x] UI element visibility control based on account type
  - [x] User permission checks

## 4. Account Management UI

### 4.1. User Profile Page
- [x] Implement via user management interface
  - [x] Personal information management
  - [x] Account status management
  - [x] Organization details (for parent accounts)

### 4.2. Team Management Interface
- [x] For parent accounts only:
  - [x] List of child accounts
  - [x] Create new child account form
  - [x] Edit permissions interface
  - [x] Deactivate/reactivate accounts

## 5. Testing

### 5.1. Backend Tests
- [ ] Add tests for new models and views:
  - [ ] User model tests
  - [ ] Authentication view tests
  - [ ] Permission tests

### 5.2. Frontend Tests
- [ ] Test authentication flows
  - [ ] Registration process
  - [ ] Login process
  - [ ] Password reset flow
  - [ ] Child account creation

## 6. Deployment & Documentation

### 6.1. Database Migrations
- [ ] Create and test migrations for user model changes
- [ ] Create data migration for existing users (set to LONE type)

### 6.2. Documentation
- [ ] Update API documentation
- [ ] Create user guide for account hierarchy
- [ ] Document permission system

## Implementation Sequence

1. **Phase 1: Core Authentication**
   - [x] Update User model
   - [x] Implement registration and email verification
   - [x] Add password reset functionality

2. **Phase 2: Account Hierarchy**
   - [x] Implement parent/child relationship in models
   - [x] Create parent account dashboard
   - [x] Add child account management

3. **Phase 3: Permissions & UI Refinement**
   - [x] Implement fine-grained permissions
   - [x] Update UI to reflect user capabilities
   - [x] Add account settings pages

4. **Phase 4: Testing & Deployment**
   - [ ] Write comprehensive tests
   - [ ] Run security audit
   - [ ] Deploy updates
