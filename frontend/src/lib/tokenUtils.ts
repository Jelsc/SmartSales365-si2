// Utilidades para manejo de tokens
export const tokenUtils = {
  getAccessToken: () => localStorage.getItem("access_token"),
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  getStoredUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  saveTokens: (tokens: { access: string; refresh: string; user?: any }) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    if (tokens.user) {
      localStorage.setItem("user", JSON.stringify(tokens.user));
    }
  },
  clearTokens: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
  isTokenExpired: (token: string | null) => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) return true;
      const payload = JSON.parse(atob(parts[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  },
};
