(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization")?.replace(/^Bearer\\s+/i, "").trim();
  const desktop = document.querySelector("main.lg\\:block");
  const mobile = document.querySelector("main.lg\\:hidden");
  const count = (section, index, value) => {
    const cards = [...(section?.querySelectorAll('section[aria-label="Overview"] > div') || [])];
    const number = cards[index]?.querySelector('p.text-\\[32px\\]');
    if (number) number.textContent = value;
  };
  const mobileCount = (index, value) => {
    const total = mobile?.querySelector('section[aria-label="Credential summary"] p.text-sm');
    if (index === 0 && total) total.textContent = value;
    const cards = [...(mobile?.querySelectorAll('section[aria-label="Credential status summary"] article') || [])];
    const el = cards[index - 1]?.querySelector('p.text-\\[10px\\]');
    if (index > 0 && el) el.textContent = value;
  };
  const statusClass = (status) => status === "Verified" ? "bg-emerald-600" : status === "Shared" ? "bg-sky-600" : status === "Rejected" || status === "Revoked" ? "bg-red-600" : "bg-amber-600";
  const timeLabel = (date) => {
    const t = new Date(date).getTime();
    if (!Number.isFinite(t)) return "";
    const hours = Math.max(0, Math.floor((Date.now() - t) / 3600000));
    return hours < 1 ? "Just now" : hours < 24 ? hours + "h ago" : Math.floor(hours / 24) + "d ago";
  };
  const el = (tag, className, value) => {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const clearAndMessage = (container, message) => {
    if (!container) return;
    container.replaceChildren(el("p", "text-sm text-slate-500", message));
  };
  const request = async (path) => {
    const response = await fetch(API + path, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed (" + response.status + ")");
    return body.data;
  };
  const getPages = async (path, key) => {
    let all = [], page = 1, totalPages = 1;
    do {
      const data = await request(path + "?page=" + page + "&limit=50");
      all.push(...(Array.isArray(data?.[key]) ? data[key] : []));
      totalPages = Number(data?.pagination?.totalPages) || 1;
      page += 1;
    } while (page <= totalPages && page <= 100);
    return all;
  };
  const desktopLists = () => {
    const headings = [...(desktop?.querySelectorAll("h2") || [])];
    const find = (name) => headings.find(h => h.textContent.trim().toLowerCase() === name)?.closest("section")?.querySelector(".mt-4.flex.flex-col");
    return { activity: find("recent activity"), shared: find("shared credential") };
  };
  const renderActivity = (container, items, small) => {
    if (!container) return;
    container.replaceChildren();
    if (!items.length) return clearAndMessage(container, "No recent credential or sharing activity.");
    for (const item of items.slice(0, small ? 4 : 5)) {
      const card = el("article", small ? "flex items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-2" : "flex items-center justify-between gap-3 rounded-xl border border-neutral-300 bg-white p-4");
      const info = el("div", "min-w-0");
      info.append(el("h3", small ? "truncate text-[8px] font-medium" : "text-[18px] font-medium", item.title), el("p", small ? "truncate text-[7px] text-slate-500" : "mt-1 text-base text-neutral-500", item.subtitle));
      const aside = el("div", "shrink-0 text-right");
      aside.append(el("p", small ? "text-[7px] text-slate-400" : "text-sm text-neutral-500", timeLabel(item.at)));
      aside.append(el("span", (small ? "text-[7px] " : "text-xs ") + "inline-block rounded-full px-2 py-1 font-semibold text-white " + statusClass(item.status), item.status));
      card.append(info, aside);
      container.append(card);
    }
  };
  const renderShares = (container, shares) => {
    if (!container) return;
    container.replaceChildren();
    if (!shares.length) return clearAndMessage(container, "No shared credentials yet.");
    for (const share of shares.slice(0, 5)) {
      const card = el("article", "rounded-xl border border-neutral-300 bg-white p-4");
      card.append(el("h3", "text-[18px] font-medium", share.organization?.name || "Organization unavailable"));
      const row = el("div", "flex items-center justify-between gap-3");
      row.append(el("p", "mt-1 text-base text-neutral-500", "Access status:"));
      let label = share.status || "Unknown";
      if (share.status === "Active" && share.expiresAt) {
        const days = Math.max(0, Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / 86400000));
        label = "Expires in " + days + (days === 1 ? " day" : " days");
      }
      row.append(el("p", "text-sm text-amber-800", label));
      card.append(row);
      container.append(card);
    }
  };
  const greet = (user) => {
    const name = user.firstName || "Citizen";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const title = desktop?.querySelector("main section h1") || desktop?.querySelector("section h1");
    if (title) title.textContent = greeting + ", " + name;
    const desktopUser = [...document.querySelectorAll("p")].find(p => p.textContent.trim() === "User");
    if (desktopUser) desktopUser.textContent = name;
    const mobileName = [...document.querySelectorAll("span")].find(s => /Good Morning Sarah/.test(s.textContent));
    if (mobileName) mobileName.textContent = greeting + " " + name;
  };
  const run = async () => {
    const lists = desktopLists();
    const mobileActivity = mobile?.querySelector('section[aria-labelledby="mobileRecentTitle"] > div.space-y-1\\.5');
    [0,1,2,3].forEach(i => count(desktop, i, "—"));
    [0,1,2,3,4].forEach(i => mobileCount(i, "—"));
    clearAndMessage(lists.activity, "Loading activity…");
    clearAndMessage(lists.shared, "Loading shares…");
    clearAndMessage(mobileActivity, "Loading activity…");
    for (const p of mobile?.querySelectorAll('section[aria-label="Credential status summary"] article p.text-\\[6px\\]') || []) p.textContent = "";
    const growth = mobile?.querySelector('section[aria-label="Credential summary"] p.mt-1');
    if (growth) growth.textContent = "Current wallet total";
    if (!token) {
      [lists.activity, lists.shared, mobileActivity].forEach(c => clearAndMessage(c, "Sign in to view your dashboard."));
      return;
    }
    try {
      const user = await request("/auth/me");
      if (user?.role !== "Citizen" || user.accountStatus !== "Active") throw new Error("An active Citizen account is required.");
      greet(user);
      const [wallet, shares] = await Promise.all([getPages("/credentials/wallet", "credentials"), getPages("/credential-shares/mine", "shares")]);
      const verified = wallet.filter(c => c.verificationStatus === "Verified").length;
      const pending = wallet.filter(c => c.verificationStatus === "Pending").length;
      const rejected = wallet.filter(c => c.verificationStatus === "Rejected").length;
      count(desktop, 0, wallet.length); count(desktop, 1, verified);
      count(desktop, 2, "—"); count(desktop, 3, shares.length);
      mobileCount(0, wallet.length); mobileCount(1, verified); mobileCount(2, pending); mobileCount(3, rejected); mobileCount(4, shares.length);
      const expiredCard = [...desktop.querySelectorAll('section[aria-label="Overview"] > div')][2];
      if (expiredCard) {
        const caption = expiredCard.querySelectorAll("p");
        if (caption.length) caption[caption.length - 1].textContent = "Expiry data unavailable";
      }
      const events = [
        ...wallet.map(c => ({title: "Credential added", subtitle: c.title || c.credentialId || "Credential", status: c.verificationStatus || "Pending", at: c.createdAt})),
        ...shares.map(s => ({title: "Credential shared - " + (s.organization?.name || "Organization"), subtitle: s.credential?.title || "Credential", status: "Shared", at: s.createdAt}))
      ].filter(x => Number.isFinite(new Date(x.at).getTime())).sort((a,b) => new Date(b.at) - new Date(a.at));
      renderActivity(lists.activity, events, false);
      renderActivity(mobileActivity, events, true);
      renderShares(lists.shared, shares);
    } catch (error) {
      [lists.activity, lists.shared, mobileActivity].forEach(c => clearAndMessage(c, "Unable to load dashboard: " + error.message));
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
