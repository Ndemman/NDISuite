# UI Redesign – Verification & Fix Checklist

This checklist will guide the step‑by‑step verification and correction of **all** code written during the recent UI redesign (light‑mode palette, sidebar, layout, dashboard overhaul, etc.).  Every item is prefixed with `[ ]` and will be marked `[x]` as it is completed.

---

## 1. Preliminary Setup
- [ ] 1.1 Pull latest code / ensure correct branch checked‑out
- [ ] 1.2 Delete `.next`, `node_modules/.cache` to avoid stale artifacts
- [ ] 1.3 Re‑install packages (`npm ci`) and ensure successful install
- [ ] 1.4 Run `npm run lint` and capture baseline error report

## 2. Global Configuration Files
### 2.1 `tailwind.config.js`
- [ ] Validate `content` globs point to new `layout` & `ui` directories
- [ ] Confirm `darkMode: ["class"]` still correct
- [ ] Verify updated `ndisuite` colors use `hsl(var(--x))` syntax
- [ ] Run `npx tailwindcss --dry-run` to ensure configuration parses

### 2.2 `next.config.js` (if exists)
- [ ] Ensure no path alias conflicts with new components directory

### 2.3 TSConfig Paths
- [ ] Ensure `@/components/*` alias includes `layout` & `ui`

## 3. Global Styles `globals.css`
- [ ] Ensure new CSS variable definitions compile (no duplicate keys)
- [ ] Verify `@tailwind` & `@layer` placement (first lines of file)
- [ ] Run a dummy `postcss` build to ensure no unknown `@apply` warnings

## 4. Core Components
### 4.1 `src/components/ui/theme-toggle.tsx`
- [ ] Confirm export matches `import { ThemeToggle }` usage
- [ ] Validate `lucide-react` icons imported correctly
- [ ] SSR‑safe mounting (`mounted` check) implemented

### 4.2 `src/components/ui/sidebar.tsx`
- [ ] Verify React routing logic (`useRouter`) & active highlighting
- [ ] Ensure collapse/expand width transitions work and have `overflow-hidden`
- [ ] Check accessibility labels for toggle button

### 4.3 `src/components/layout/AppLayout.tsx`
- [ ] Confirm composition: `<Sidebar />`, header, `<ThemeToggle />`, `children`
- [ ] Ensure wrapper `div` uses `bg-background text-foreground`
- [ ] Verify missing imports (`ReactNode`, icons) resolved

## 5. Page Integrations
### 5.1 `_app.tsx`
- [ ] Confirm removal of forced dark mode & redundant imports
- [ ] Ensure new `AppLayout` wrapped correctly for **all** pages (or each page imports layout)
- [ ] Fix remaining lint error: cannot find `@/components/ui/theme-toggle` types declaration (add `index.d.ts` or correct path)

### 5.2 `dashboard.tsx`
- [ ] Resolve TypeScript errors (`searchQuery`, `filterStatus` etc.)
- [ ] Verify `AppLayout` import path & JSX closed‑tag balance
- [ ] Run `npm run lint` focusing on this file
- [ ] Test dashboard in light/dark modes, collapsed sidebar, search filter, new report button

## 6. Supporting Pages
- [ ] Confirm pages referencing `bg-ndisuite-background text-white` updated to variable classes (`bg-background text-foreground`)
- [ ] Grep for `text-white` / `bg-gray‑800` etc. and refactor where necessary for theme compliance

## 7. Assets & Icons
- [ ] Ensure `lucide-react` icons list imported per file, tree‑shaking fine

## 8. Build & Runtime Verification
- [ ] Run `npm run dev` – confirm no **runtime** errors in console
- [ ] Run `npm run build` – ensure production build passes
- [ ] Launch exported build / start server on port 3000 and verify UI

## 9. Documentation Updates
- [ ] Update `update.md` progress ticks for completed tasks
- [ ] When checklist items above are fixed, tick them `[x]` and commit

---

**Next Steps:**
1. Work through sections in order, ticking `[x]` as each sub‑step is completed.
2. Commit and push after each logical section to maintain isolated commits.
3. Once all items ticked, re‑run full `npm run build` for final confirmation.
