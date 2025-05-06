# CSRF Cookie Prefetch (Agent Instructions)

**Goal:** Ensure the CSRF token cookie is set before login POST so the `X-CSRFToken` header contains the correct value.

---

## 1. Modify the Login Component

In your login page component file (e.g. `src/pages/auth/login.tsx`), add the following at the top or inside the component function:

```ts
import { useEffect } from 'react';

useEffect(() => {
  // Pre‑flight GET to set the CSRF cookie
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
    method: 'GET',
    credentials: 'include',
  });
}, []);
```

---

## 2. Leave POST Code Intact

Ensure your existing login POST call still includes:

```ts
credentials: 'include',
headers: {
  'Content-Type': 'application/json',
  'X-CSRFToken': getCookie('csrftoken') || '',
},
```

---

## 3. Rebuild & Restart Frontend

Run in project root:

```bash
docker compose build frontend
docker compose up -d frontend
```

---

## 4. Hard‑Refresh & Test

1. Go to `http://localhost:3000/auth/login`.  
2. Press **Ctrl + F5** (Windows) or **⌘ + Shift + R** (Mac).  
3. Submit credentials and verify the POST returns **200 OK**.

---

Reply with **“login works!”** or any new errors.
