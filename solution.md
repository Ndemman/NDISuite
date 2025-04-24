# NDISuite Registration and Login Issues: Technical Analysis

## Overview

This document details the technical challenges encountered with user registration and authentication in the NDISuite application when operating in a Docker containerized environment. The primary symptoms included registration form failures with empty error responses (`[ERROR] Registration error: {}`) and subsequent inability to authenticate.

## Architecture Context

The application consists of:
- **Frontend**: Next.js (v14) TypeScript application 
- **Backend**: Django REST Framework with JWT-based authentication
- **Database**: PostgreSQL 14
- **Infrastructure**: Docker Compose orchestration

## Issue Analysis

### Root Causes Identified

1. **API Endpoint Path Misalignment**
   - The frontend's `authService.ts` was making API calls to `/auth/register/` (relative path)
   - When combined with the environment-provided base URL (`http://localhost:8000/api/v1`), the resulting path would be `http://localhost:8000/api/v1/auth/register/`
   - However, the backend had all auth routes mounted at `/api/v1/auth/`, creating a double `auth` path segment (`/api/v1/auth/auth/register/`)
   - The result was 404 errors returning empty JSON objects, which the frontend displayed as `Registration error: {}`

2. **Frontend Environment Variable Configuration**
   - Hardcoded API URLs in Dockerfile (`ENV NEXT_PUBLIC_API_URL=https://api.ndisuite.app`)
   - These values were overridden during Docker Compose, but showed potential for environment-specific URL structure inconsistencies

3. **Username Field Requirements Mismatch**
   - The `RegisterSerializer` in the backend required `username` as a field
   - However, the frontend form did not explicitly collect or provide a username field
   - The backend auto-populated username using email, but still expected it in the request payload

4. **Backend API Versioning and Route Structure**
   - The backend URL structure (`/api/v1/auth/`) revealed potential issues with route nesting
   - The extra `/auth/` segment in both the base URL and endpoint paths created confusion

5. **PostgreSQL Version Compatibility**
   - Initial deployment failed due to PostgreSQL 13 being used while Django required PostgreSQL 14+
   - This manifested as a database connection initialization failure

## Resolution Attempts

### 1. Database Compatibility Fix (Successful)

```yaml
# Changed PostgreSQL version in docker-compose.yml
- image: postgres:13
+ image: postgres:14
```

This resolved the initial backend startup failure with error:
```
django.db.utils.NotSupportedError: PostgreSQL 14 or later is required (found 13.20).
```

### 2. Backend Documentation API Dependency Fix (Successful)

Removed unnecessary API documentation dependency:
```python
# ndisuite/urls.py
- from rest_framework.documentation import include_docs_urls
...
- path('docs/', include_docs_urls(title='NDISuite API')),
```

This eliminated the backend error:
```
AssertionError: `coreapi` must be installed for schema support.
```

### 3. Frontend API URL Base Path Correction (Partial Success)

Updated environment variable in the docker-compose.yml:
```yaml
# docker-compose.yml frontend service
- NEXT_PUBLIC_API_URL=http://localhost:8000/api
+ NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

This aligned the base URL with the backend's URL structure but did not fully resolve the endpoint mismatch.

### 4. Frontend Dockerfile Environment Variables Cleanup (Optimization)

Removed hardcoded API URLs from the frontend Dockerfile:
```dockerfile
- # Set environment variables
- ENV NEXT_PUBLIC_API_URL=https://api.ndisuite.app
- ENV NEXT_PUBLIC_WS_HOST=api.ndisuite.app
```

This eliminated potential environment-specific URL path conflicts.

### 5. API Endpoint Path Structure Correction (Unsuccessful)

First attempt: Removed leading slashes from endpoint paths in the authService.ts:
```typescript
// authService.ts
- const response = await apiPost<LoginResponse>('/auth/login/', credentials);
+ const response = await apiPost<LoginResponse>('auth/login/', credentials);
```

Subsequent attempt: Restored leading slashes (reverting to original state):
```typescript
// authService.ts
- const response = await apiPost<LoginResponse>('auth/login/', credentials);
+ const response = await apiPost<LoginResponse>('/auth/login/', credentials);
```

Neither approach fully resolved the issue due to the underlying route structure inconsistency.

### 6. Backend Serializer Relaxation (Attempted)

Made the `username` field optional in the RegisterSerializer:
```python
# users/serializers.py
class Meta:
    model = User
-   fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 
+   fields = ['email', 'password', 'password_confirm', 'first_name', 
    ...
    extra_kwargs = {
        'first_name': {'required': True},
        'last_name': {'required': True},
        'organization': {'required': False},
+       'username': {'required': False},
    }
```

And updated the user creation logic:
```python
- username=validated_data['email'],  # Use email as username
+ username=validated_data.get('username', validated_data['email']),  # Use email as username if not provided
```

## Recommended Solutions

From the resolution attempts, three primary approaches emerge as viable solutions:

### Option 1: URL Structure Alignment (Most Direct)

Create consistency between backend URL mount points and frontend API path construction:

1. In `ndisuite/urls.py`, change:
```python
urlpatterns = [
    ...
-   path('api/v1/auth/', include('users.urls')),
+   path('api/v1/users/', include('users.urls')),
    ...
]
```

2. Update all frontend API endpoints to use `/users/...` instead of `/auth/...`.

### Option 2: Frontend Path Construction Overhaul (Alternative)

Redesign the frontend's API client to more intelligently construct URLs:

1. Modify `apiClient.ts` to handle path joining properly
2. Add configuration for API route prefixes that align with backend structure

### Option 3: Backend URL Middleware (Comprehensive)

Implement a backend middleware to handle URL normalization:

1. Create a Django middleware that detects and redirects requests with double `/auth/auth/` path segments
2. This provides backward compatibility without requiring frontend changes

## Conclusion

The registration and login issues primarily stemmed from API path misalignment between frontend and backend services. The most promising resolution approach is Option 1, which creates consistency between the backend URL mount points and the frontend API path construction.

For long-term maintainability, implementing proper URL path joining in the frontend and standardizing on a consistent URL structure pattern across the application would prevent similar issues in the future.
