// Organization dashboard session guard.
// This is a client-side navigation guard, not a replacement for backend authorization.
(() => {
  const LOGIN_URL = "../Authentication/Login/login.html";
  const token = localStorage.getItem("authorization");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user || user.role !== "Organization") {
    // Do not remove a valid session for another role.
    if (!token || !user) {
      localStorage.removeItem("authorization");
      localStorage.removeItem("user");
    }
    window.location.replace(LOGIN_URL);
    return;
  }

  // API requests must still be authorized by the backend.
  window.VerifyDocOrganizationSession = Object.freeze({
    getToken: () => localStorage.getItem("authorization"),
    getUser: () => user,
    logout: () => {
      localStorage.removeItem("authorization");
      localStorage.removeItem("user");
      window.location.replace(LOGIN_URL);
    }
  });
})();
