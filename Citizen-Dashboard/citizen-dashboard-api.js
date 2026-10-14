(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const make = (tag, cls, value) => {
    const element = document.createElement(tag);
    element.className = cls;
    if (value !== undefined) element.textContent = String(value);
    return element;
  };
  const setMessage = (parent, message) => {
    if (parent) parent.replaceChildren(make("p", "text-sm text-slate-500", message));
  };
  const cards = () => [...document.querySelectorAll('section[aria-label="Overview"] > div')];
  const desktopSections = () => {
    const recent = document.querySelector('section[aria-labelledby="recent-title"] .mt-4.flex.flex-col');
    const shares = document.querySelector('section[aria-labelledby="quick-title"] .mt-4.flex.flex-col');
    return { recent, shares };
  };
  const mobileSection = () => document.querySelector('section[aria-labelledby="mobileRecentTitle"]');
  const mobileList = () => [...(mobileSection()?.querySelectorAll("div") || [])].find(div => div.classList.contains("space-y-1.5"));
  const setNumber = (card, value) => {
    const number = [...(card?.querySelectorAll("p") || [])].find(p => p.classList.contains("font-bold"));
    if (number) number.textContent = value;
  };
  const renderCounts = data => {
    const c = cards();
    [data.totalCredentials, data.verifiedCredentials, data.expiredCredentials ?? "—", data.sharedCredentials]
      .forEach((value, index) => setNumber(c[index], value));
    const expired = c[2]?.querySelectorAll("p");
    if (expired?.length) expired[expired.length - 1].textContent = data.expiredCredentials == null ? "Expiry data unavailable" : "Expired credential";
    const mobile = document.querySelector('section[aria-label="Credential summary"]');
    const total = mobile?.querySelector("p.text-sm");
    if (total) total.textContent = String(data.totalCredentials);
    const growth = mobile?.querySelector("p.mt-1");
    if (growth) growth.textContent = "Current wallet total";
    const small = [...document.querySelectorAll('section[aria-label="Credential status summary"] article')];
    [data.verifiedCredentials, data.pendingCredentials, data.rejectedCredentials, data.sharedCredentials]
      .forEach((value, index) => {
        const labels = [...(small[index]?.querySelectorAll("p") || [])];
        const number = labels.find(p => p.classList.contains("font-bold")) || labels[0];
        if (number) number.textContent = String(value);
        for (const p of labels) if (p.classList.contains("text-[6px]")) p.textContent = "";
      });
  };
  const relative = date => {
    const time = new Date(date).getTime();
    if (!Number.isFinite(time)) return "Date unavailable";
    const hours = Math.max(0, Math.floor((Date.now() - time) / 3600000));
    return hours < 1 ? "Just now" : hours < 24 ? hours + "h ago" : Math.floor(hours / 24) + "d ago";
  };
  const renderActivity = (container, events, compact = false) => {
    if (!container) return;
    container.replaceChildren();
    if (!events.length) return setMessage(container, "No recent activity.");
    for (const event of events.slice(0, compact ? 4 : 5)) {
      const row = make("article", compact ? "flex items-center justify-between gap-2 rounded-md border border-slate-200 p-2" : "flex items-center justify-between gap-3 rounded-xl border border-neutral-300 bg-white p-4");
      const info = make("div", "min-w-0");
      info.append(make("h3", compact ? "truncate text-[8px] font-medium" : "text-[18px] font-medium", event.title || "Credential activity"),
        make("p", compact ? "truncate text-[7px] text-slate-500" : "mt-1 text-base text-neutral-500", event.detail || event.credentialId || "Credential"));
      const aside = make("div", "shrink-0 text-right");
      aside.append(make("p", compact ? "text-[7px] text-slate-500" : "text-sm text-neutral-500", relative(event.createdAt)));
      const state = event.type === "CredentialShared" ? "Shared" : event.status || "Pending";
      const color = state === "Verified" ? "bg-emerald-600" : state === "Shared" ? "bg-sky-600" : state === "Rejected" || state === "Revoked" ? "bg-red-600" : "bg-amber-600";
      aside.append(make("span", (compact ? "text-[7px] " : "text-xs ") + "inline-block rounded-full px-2 py-1 font-semibold text-white " + color, state));
      row.append(info, aside);
      container.append(row);
    }
  };
  const renderShares = (container, shares) => {
    if (!container) return;
    container.replaceChildren();
    if (!shares.length) return setMessage(container, "No shared credentials yet.");
    for (const share of shares.slice(0, 5)) {
      const row = make("article", "rounded-xl border border-neutral-300 bg-white p-4");
      row.append(make("h3", "text-[18px] font-medium", share.organizationName || "Organization unavailable"));
      const info = make("div", "flex items-center justify-between gap-3");
      info.append(make("p", "mt-1 text-base text-neutral-500", share.credentialTitle || "Shared credential"));
      let state = share.status || "Unknown";
      if (state === "Active" && share.expiresAt) {
        const days = Math.max(0, Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / 86400000));
        state = "Expires in " + days + (days === 1 ? " day" : " days");
      }
      info.append(make("p", "text-sm text-amber-800", state));
      row.append(info);
      container.append(row);
    }
  };
  const run = async () => {
    const { recent, shares } = desktopSections();
    const mobile = mobileList();
    renderCounts({ totalCredentials: "—", verifiedCredentials: "—", expiredCredentials: null, sharedCredentials: "—", pendingCredentials: "—", rejectedCredentials: "—" });
    [recent, shares, mobile].forEach(x => setMessage(x, "Loading dashboard…"));
    try {
      if (!token) throw new Error("Sign in to view your dashboard.");
      const response = await fetch(API + "/citizen/dashboard", { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Request failed (" + response.status + ")");
      const data = json.data;
      if (!data || typeof data.totalCredentials !== "number") throw new Error("Invalid dashboard response.");
      renderCounts(data);
      renderActivity(recent, data.recentActivity || []);
      renderActivity(mobile, data.recentActivity || [], true);
      renderShares(shares, data.recentShares || []);
    } catch (error) {
      [recent, shares, mobile].forEach(x => setMessage(x, "Unable to load dashboard: " + error.message));
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
