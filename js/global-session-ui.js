// Shared authenticated dashboard controls for all VerifyDoc roles.
(() => {
  "use strict";
  const LOGIN = "../Authentication/Login/login.html";
  const FALLBACK = "../images/user.avif";
  const API = "https://verifydoc-api-v1.onrender.com";
  const logoutSelector = 'button[aria-label="Log out"], button#logout, a[aria-label="Log out"], [data-verifydoc-logout]';
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();

  function logout(event) {
    const control = event.target.closest?.(logoutSelector);
    if (!control) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    localStorage.removeItem("authorization");
    localStorage.removeItem("user");
    window.location.replace(LOGIN);
  }
  // Capture before older page-specific click handlers, so they cannot interfere.
  document.addEventListener("click", logout, true);

  function avatar(img, src, name) {
    img.src = src;
    img.alt = name + " profile picture";
    img.onerror = () => {
      img.onerror = null;
      img.src = FALLBACK;
    };
  }

  function applyProfile(user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "User";
    const raw = user.profilePicture?.url;
    const photo = typeof raw === "string" && /^https:\/\//i.test(raw) ? raw : FALLBACK;

    // Existing profile image elements only; do not modify decorative images.
    document.querySelectorAll('#NavprofilePicture, #profilePicture, img[alt="Admin profile"], img[alt="Organization user profile"], img[data-user-avatar]').forEach(img => avatar(img, photo, fullName));

    // Sidebar initials placeholders and the header's own avatar.
    document.querySelectorAll("aside, #mobileMenu").forEach(panel => {
      panel.querySelectorAll("span.rounded-full").forEach(span => {
        if (span.querySelector("img,svg,i")) return;
        if (!/^[A-Za-z]{1,2}$/.test(span.textContent.trim())) return;
        const img = document.createElement("img");
        img.className = span.className.replace(/bg-\S+|text-\S+|place-items-center|font-bold|grid/g, "").trim() + " rounded-full object-cover";
        img.classList.add("h-10", "w-10");
        avatar(img, photo, fullName);
        span.replaceWith(img);
      });
    });
    // Header avatar placeholders on Citizen and Institution pages.
    document.querySelectorAll('header span.rounded-full, #initials').forEach(span => {
      if (span.querySelector("img,svg,i") || !/^[A-Za-z]{0,2}$/.test(span.textContent.trim())) return;
      const img = document.createElement("img");
      img.className = "h-8 w-8 rounded-full object-cover";
      avatar(img, photo, fullName);
      span.replaceWith(img);
    });
  }

  async function loadProfile() {
    const auth = token();
    if (!auth) return;
    try {
      const response = await fetch(API + "/auth/me", {
        headers: { Authorization: "Bearer " + auth, Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) return;
      const json = await response.json();
      if (json.data && token() === auth) applyProfile(json.data);
    } catch (error) {
      console.warn("VerifyDoc profile image unavailable:", error);
      // Default avatars still show even if the API is temporarily unavailable.
    }
  }
  function init() {
    // Show the bundled avatar immediately; replace only if an uploaded photo exists.
    document.querySelectorAll('#NavprofilePicture, #profilePicture, img[alt="Admin profile"], img[alt="Organization user profile"], img[data-user-avatar]').forEach(img => {
      img.onerror = () => { img.onerror = null; img.src = FALLBACK; };
    });
    loadProfile();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
