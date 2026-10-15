// Shared identity rendering across all VerifyDoc organization pages.
(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const FALLBACK = "../images/user.avif";
  const session = () => window.VerifyDocOrganizationSession;
  const setText = (node, value) => { if (node) node.textContent = value; };
  const fullName = user => [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Organization user";
  const imageURL = user => {
    const value = user?.profilePicture?.url;
    return typeof value === "string" && /^https:\/\//i.test(value) ? value : FALLBACK;
  };
  function replaceAvatar(target, user) {
    if (!target) return;
    const img = target.tagName === "IMG" ? target : document.createElement("img");
    if (target !== img) {
      img.className = "h-10 w-10 shrink-0 rounded-full object-cover";
      target.replaceWith(img);
    }
    img.alt = fullName(user) + " profile picture";
    img.onerror = () => { img.onerror = null; img.src = FALLBACK; };
    img.src = imageURL(user);
  }
  function renderUser(user) {
    const name = fullName(user);
    const header = document.querySelector("main > header");
    // Different employer pages use either an image or a circular placeholder in their top bar.
    const profile = header?.querySelector('img[alt="Organization user profile"], img[alt="John Doe"], img[data-user-avatar]');
    const headerContainer = profile?.parentElement;
    if (profile) {
      replaceAvatar(profile, user);
      const details = headerContainer?.querySelector(".text-sm");
      if (details) {
        setText(details.querySelector(".font-semibold"), name);
        setText(details.querySelector(".text-xs"), user?.role || "Organization");
      }
    } else if (header) {
      const candidates = [...header.querySelectorAll("div")];
      const textNode = candidates.find(node => node.querySelector(":scope > p.font-semibold") && node.querySelector(":scope > p.text-xs"));
      if (textNode) {
        setText(textNode.querySelector(":scope > p.font-semibold"), name);
        setText(textNode.querySelector(":scope > p.text-xs"), user?.role || "Organization");
        const adjacent = textNode.previousElementSibling;
        if (adjacent && (adjacent.matches("img, span") || adjacent.querySelector("svg"))) replaceAvatar(adjacent, user);
      }
    }
    // Sidebar footer has a single organization identity block, not the navigation labels.
    const footer = document.querySelector("aside .border-t")?.parentElement?.querySelector(".flex.items-center.justify-between");
    if (footer) {
      const orgLabel = footer.querySelector("p.text-white");
      const orgType = footer.querySelector("p.text-slate-400");
      if (orgLabel && /TechCrush Solutions|Organization|Loading organization/i.test(orgLabel.textContent)) setText(orgLabel, "Loading organization…");
      if (orgType) setText(orgType, user?.role || "Organization");
      const initials = footer.querySelector("span.rounded-full");
      const avatar = footer.querySelector("img.rounded-full") || initials;
      if (avatar) replaceAvatar(avatar, user);
    }
  }
  function renderOrganization(organization) {
    const footer = document.querySelector("aside .border-t")?.parentElement?.querySelector(".flex.items-center.justify-between");
    if (footer) {
      setText(footer.querySelector("p.text-white"), organization?.organizationName || "Organization");
      setText(footer.querySelector("p.text-slate-400"), organization?.organizationType || "Organization");
    }
    const header = document.querySelector("main > header");
    const profile = header?.querySelector('img[alt$="profile picture"]');
    const block = profile?.parentElement?.querySelector(".text-sm");
    if (block) setText(block.querySelector(".text-xs"), organization?.organizationType || "Organization");
    else {
      const name = [...(header?.querySelectorAll("p.font-semibold") || [])].find(p => p.parentElement?.querySelector("p.text-xs"));
      if (name) setText(name.parentElement.querySelector("p.text-xs"), organization?.organizationType || "Organization");
    }
  }
  async function load() {
    const guard = session();
    if (!guard || !(await guard.ready)) return;
    const user = guard.getUser();
    if (!user || user.role !== "Organization") return;
    renderUser(user);
    try {
      const response = await fetch(API + "/organization/dashboard", {
        headers: { Authorization: "Bearer " + guard.getToken(), Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error("Organization information unavailable");
      const json = await response.json();
      if (json.data?.organization) renderOrganization(json.data.organization);
    } catch (error) {
      console.warn("Unable to load organization identity:", error);
      const footer = document.querySelector("aside .border-t")?.parentElement?.querySelector(".flex.items-center.justify-between");
      setText(footer?.querySelector("p.text-white"), "Organization unavailable");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
