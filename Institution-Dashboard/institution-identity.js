(() => {
  "use strict";
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return;
  async function run() {
    try {
      const response = await fetch("https://verifydoc-api-v1.onrender.com/institutions/me", {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) return;
      const body = await response.json();
      const name = body.data?.institutionName?.trim();
      if (!name) return;
      // Sidebar identity next to the logout button, including mobile navigation.
      document.querySelectorAll("aside").forEach(aside => {
        const logout = aside.querySelector('button[aria-label="Log out"], button#logout');
        const group = logout?.parentElement;
        const identity = group?.querySelector("span.text-lg, span.font-medium:not(.text-xl), p.font-semibold");
        if (identity) identity.textContent = name;
      });
      // The institution dashboard may also update this label after /auth/me resolves.
      const greeting = document.querySelector("main h1");
      if (greeting && /^Good (morning|afternoon|evening),/i.test(greeting.textContent.trim())) {
        greeting.textContent = greeting.textContent.replace(/^(Good (?:morning|afternoon|evening),)\s*.*/i, "$1 " + name);
      }
    } catch (error) {
      console.warn("Institution identity unavailable:", error);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
