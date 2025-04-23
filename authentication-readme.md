# NDISuite Authentication System

This branch contains the implementation of the enhanced authentication system for NDISuite, featuring:

## Features

- **Hierarchical Account Structure**:
  - Parent accounts can manage child accounts
  - Child accounts with configurable permissions
  - Lone accounts for individual users

- **User Management**:
  - Email verification
  - Password reset functionality
  - Profile management

- **Security**:
  - JWT-based authentication
  - Permission-based access control
  - Secure password handling

## Components

### Backend (Django)

- Updated User model with account type and permissions
- API endpoints for registration, verification, and password reset
- Custom permission classes for hierarchical access control
- Email templates for notifications

### Frontend (Next.js)

- Registration form with account type selection
- Email verification page
- Password reset flow
- User profile management
- User management interface for parent accounts

## Implementation Details

The authentication system is built on Django's authentication framework with custom extensions to support the hierarchical account structure. The frontend uses Next.js with React Hook Form for form handling and validation.

This implementation follows best practices for security and user experience, providing a complete solution for user authentication and management in the NDISuite application.
