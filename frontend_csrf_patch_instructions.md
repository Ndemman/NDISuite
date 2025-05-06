# CSRF Fix Implementation (Agent Instructions)

Have your coding agent apply the CSRF‐token snippet into the frontend login code.

---

## 1. Add CSRF helper at top of login file

At the top of the file you identified (e.g. `src/services/authService.ts`), insert:

```ts
// Helper to read a cookie by name
function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(^|; )' + name + '=([^;]+)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}
```

---

## 2. Update the login fetch call

Inside the same file, locate the function that does:

```ts
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
  method: 'POST',
  /* … */
});
```

Replace its options with:

```ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login/`, {
  method: 'POST',
  credentials: 'include',                // send cookies
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCookie('csrftoken') || '',
  },
  body: JSON.stringify({ email, password }),
});
```

---

## 3. Save, rebuild & report

After insertion:

1. Save the file.
2. Run:
   ```bash
   docker compose build frontend
   docker compose up -d frontend
   ```
3. Hard‑refresh the login page (Ctrl + F5) and attempt login.

---

## 4. Report back

Once your agent finishes, return here with a short report:

- Confirmation the snippet was added.
- Any new console/network behavior (e.g. status code, response JSON).

We’ll then verify and wrap up.
