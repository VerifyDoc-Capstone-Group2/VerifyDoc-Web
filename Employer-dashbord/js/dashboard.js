document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Mobile sidebar drawer toggle functionality
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (mobileMenuBtn && sidebar && sidebarOverlay) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('-translate-x-full');
      sidebarOverlay.classList.toggle('hidden');
    };

    mobileMenuBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
  }
});

// Dashboard data is scoped to the signed-in organization.
document.addEventListener("DOMContentLoaded", async () => {
  const main = document.querySelector("main");
  const cards = Array.from(main?.querySelectorAll(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3 > div") || []);
  const activity = Array.from(main?.querySelectorAll("h2") || []).find(h => h.textContent.trim() === "Recent Activity")?.parentElement?.nextElementSibling;
  const sharedHeading = Array.from(main?.querySelectorAll("h2") || []).find(h => h.textContent.trim() === "Shared Credentials");
  const sharedCount = sharedHeading?.parentElement?.parentElement?.querySelector(".text-4xl");
  const welcome = main?.querySelector("h1");
  const session = window.VerifyDocOrganizationSession;

  for (const card of cards) {
    const count = card.querySelector(".text-3xl");
    if (count) count.textContent = "—";
    const trend = card.querySelector(".text-xs.font-medium.mt-2");
    if (trend) trend.textContent = "Awaiting live data";
  }
  if (sharedCount) sharedCount.textContent = "—";
  if (activity) activity.replaceChildren();
  if (!session || !(await session.ready)) return;

  const user = session.getUser();
  if (welcome) welcome.textContent = `Welcome, ${[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Organization"}`;

  const get = async (path) => {
    const response = await fetch(`https://verifydoc-api-v1.onrender.com${path}`, {
      headers: { Authorization: `Bearer ${session.getToken()}` }, cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Dashboard data unavailable");
    return body.data;
  };

  // Walk paginated APIs to avoid presenting first-page counts as totals.
  const allPages = async (path, key, totalPagesKey = "totalPages") => {
    const collected = [];
    for (let page = 1; page <= 200; page++) {
      const join = path.includes("?") ? "&" : "?";
      const data = await get(`${path}${join}page=${page}&limit=50`);
      const items = data?.[key];
      if (!Array.isArray(items)) throw new Error("Invalid dashboard API response");
      collected.push(...items);
      const totalPages = data.pagination?.[totalPagesKey];
      if (Number.isInteger(totalPages)) {
        if (page >= totalPages) return collected;
      } else if (items.length < 50) {
        return collected;
      }
    }
    throw new Error("Too many pages to calculate a reliable total");
  };

  const [sharesResult, confirmationsResult] = await Promise.allSettled([
    allPages("/credential-shares/organization", "shares"),
    allPages("/credential-confirmations/organization", "requests")
  ]);
  const shares = sharesResult.status === "fulfilled" ? sharesResult.value : null;
  const requests = confirmationsResult.status === "fulfilled" ? confirmationsResult.value : null;

  // No verification-event tracking exists in the current backend.
  if (cards[0]) {
    const trend = cards[0].querySelector(".text-xs.font-medium.mt-2");
    if (trend) trend.textContent = "Verification analytics not yet available";
  }
  if (cards[1]) {
    const count = cards[1].querySelector(".text-3xl");
    if (count && requests) count.textContent = String(requests.filter(r => r.status === "Pending").length);
    const trend = cards[1].querySelector(".text-xs.font-medium.mt-2");
    if (trend) trend.textContent = requests ? "Pending fresh confirmations" : "Unable to load requests";
  }
  if (cards[2]) {
    const count = cards[2].querySelector(".text-3xl");
    if (count && requests) count.textContent = String(requests.filter(r => ["Confirmed", "Disputed"].includes(r.status)).length);
    const trend = cards[2].querySelector(".text-xs.font-medium.mt-2");
    if (trend) trend.textContent = requests ? "Responded fresh confirmations" : "Unable to load requests";
  }
  if (sharedCount) sharedCount.textContent = shares ? String(shares.length) : "—";
  const sharedDescription = sharedCount?.nextElementSibling;
  if (sharedDescription) sharedDescription.textContent = shares ? "Active shared credentials" : "Unable to load shared credentials";

  if (activity) {
    const entries = [
      ...(shares || []).map(s => ({ title: "Credential shared", detail: [s.credential?.title, s.credential?.issuerName].filter(Boolean).join(" • "), time: s.createdAt, status: s.status })),
      ...(requests || []).map(r => ({ title: "Fresh confirmation request", detail: r.reason || "Confirmation requested", time: r.createdAt, status: r.status }))
    ].sort((a,b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0,5);
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "text-sm text-slate-500";
      empty.textContent = shares === null && requests === null ? "Activity unavailable." : "No recent activity.";
      activity.append(empty);
    }
    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 gap-3";
      const left = document.createElement("div");
      const title = document.createElement("p");
      title.className = "text-sm font-semibold text-slate-800";
      title.textContent = entry.title;
      const detail = document.createElement("p");
      detail.className = "text-xs text-slate-500";
      detail.textContent = entry.detail;
      left.append(title, detail);
      const right = document.createElement("div");
      right.className = "text-xs text-slate-500";
      right.textContent = `${entry.time ? new Date(entry.time).toLocaleDateString() : ""} • ${entry.status || ""}`;
      row.append(left, right);
      activity.append(row);
    }
  }
});
