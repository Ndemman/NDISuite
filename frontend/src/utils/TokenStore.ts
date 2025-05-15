// In-memory token storage for JWT tokens 
// This approach keeps the access token in memory only (not persisted)
// while the refresh token is handled by HTTP-only cookies

let _access: string | null = null;
let _refresh: string | null = null;

export const TokenStore = {
  get access() { return _access; },
  get refresh() { return _refresh; },
  set: (acc: string, ref: string) => { _access = acc; _refresh = ref; },
  clear: () => { _access = _refresh = null; },
};

// Expose TokenStore for debugging in development environments
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  window.TokenStore = TokenStore;
}

export default TokenStore;
