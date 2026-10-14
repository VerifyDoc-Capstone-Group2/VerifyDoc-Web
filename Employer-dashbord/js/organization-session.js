// Organization-only session guard. Server remains the authority for access.
(() => {
  const LOGIN_URL = "../Authentication/Login/login.html";
  const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization");

  const redirectToLogin = (clearSession = true) => {
    if (clearSession) {
      localStorage.removeItem("authorization");
      localStorage.removeItem("user");
    }
    window.location.replace(LOGIN_URL);
  };

  let cachedUser;
  try {
    cachedUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    cachedUser = null;
  }

  if (!token || !cachedUser || cachedUser.role !== "Organization") {
    redirectToLogin(!token || !cachedUser);
    return;
  }

  // Confirm the session against the backend instead of trusting localStorage.
  const ready = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return false;
      }
      if (!response.ok) throw new Error("Session validation unavailable");
      const result = await response.json();
      const user = result.data;
      if (!user || user.role !== "Organization" || user.accountStatus !== "Active") {
        redirectToLogin(user?.role === "Organization");
        return false;
      }
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } catch (error) {
      // Fail closed: do not treat a network failure as successful validation.
      console.error("Unable to validate organization session:", error);
      redirectToLogin(false);
      return false;
    }
  })();

  window.VerifyDocOrganizationSession = Object.freeze({
    ready,
    getToken: () => localStorage.getItem("authorization"),
    getUser: () => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); }
      catch { return null; }
    },
    logout: () => redirectToLogin()
  });
})();
