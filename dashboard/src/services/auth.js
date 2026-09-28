const TOKEN_KEY = "jansetu.policymakerToken";

export const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "policymaker" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const saveAuthToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);

export const clearAuthToken = () => sessionStorage.removeItem(TOKEN_KEY);
