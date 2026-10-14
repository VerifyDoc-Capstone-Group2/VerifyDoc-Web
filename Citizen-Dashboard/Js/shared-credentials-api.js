(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const table = document.querySelector('section[aria-label="Your shared credentials"] ul');
  const counter = document.querySelector("main h1")?.parentElement?.parentElement?.querySelector("p span");
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const text = (tag, cls, value) => { const el = document.createElement(tag); el.className = cls; el.textContent = String(value); return el; };
  const remaining = expiry => {
    const time = new Date(expiry).getTime();
    if (!Number.isFinite(time)) return "Unavailable";
    const days = Math.max(0, Math.ceil((time - Date.now()) / 86400000));
    return days === 0 ? "Less than 1 day" : days + (days === 1 ? " day" : " days");
  };
  const row = share => {
    const li = text("li", "grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_100px] md:items-center md:gap-4 md:px-5", "");
    const credential = text("div", "", "");
    credential.append(text("p", "text-sm font-semibold text-slate-900", share.credential?.title || "Credential unavailable"));
    credential.append(text("p", "mt-1 text-xs text-slate-500", share.credential?.issuerName || "Issuer unavailable"));
    const employer = text("div", "", "");
    employer.append(text("p", "text-[10px] font-medium uppercase text-slate-400 md:hidden", "Employer"));
    employer.append(text("p", "text-sm text-slate-700", share.organization?.name || "Organization unavailable"));
    const expiry = text("div", "", "");
    expiry.append(text("p", "text-[10px] font-medium uppercase text-slate-400 md:hidden", "Access expiry"));
    expiry.append(text("p", "text-sm text-slate-700", share.status === "Active" ? remaining(share.expiresAt) : share.status || "Unavailable"));
    const link = text("a", "inline-flex h-9 items-center justify-center rounded-md border border-blue-600 px-4 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300", "Review");
    link.href = "./Shared-Credential-Details.html?shareId=" + encodeURIComponent(share.shareId);
    li.append(credential, employer, expiry, link);
    return li;
  };
  async function load() {
    if (!table) return;
    table.replaceChildren(text("li", "px-5 py-6 text-sm text-slate-500", "Loading shared credentials…"));
    if (counter) counter.textContent = "—";
    try {
      if (!token) throw new Error("Please sign in to view your shares.");
      const shares = [];
      let page = 1, totalPages = 1;
      do {
        const response = await fetch(API + "/credential-shares/mine?page=" + page + "&limit=50", { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Could not retrieve shared credentials.");
        if (!Array.isArray(result.data?.shares)) throw new Error("Invalid sharing response.");
        shares.push(...result.data.shares);
        totalPages = result.data.pagination?.totalPages || 1;
        page++;
      } while (page <= totalPages);
      const active = shares.filter(s => s.status === "Active");
      if (counter) counter.textContent = String(active.length);
      table.replaceChildren(...(shares.length ? shares.map(row) : [text("li", "px-5 py-6 text-sm text-slate-500", "You have not shared any credentials yet.")]));
    } catch (error) {
      table.replaceChildren(text("li", "px-5 py-6 text-sm text-red-700", error.message));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
