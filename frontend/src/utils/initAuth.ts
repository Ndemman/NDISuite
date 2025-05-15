import { TokenStore } from "@/utils/TokenStore";

export const initAuth = () => {
  if (typeof window === "undefined") return;           // SSR guard
  const access  = localStorage.getItem("access");
  const refresh = localStorage.getItem("refresh");
  if (access && !TokenStore.access) {
    TokenStore.set(access, refresh || "");
  }
};
