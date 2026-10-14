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
  const header = document.querySelector("main > header");
  const profileBlock = header?.querySelector('img[alt="John Doe"]')?.parentElement;
  const avatar = profileBlock?.querySelector("img");
  const profileName = profileBlock?.querySelector(".font-semibold");
  const profileType = profileBlock?.querySelector(".text-xs.text-slate-500");
  const organizationLabel = document.querySelector("aside .border-t .font-semibold");
  const fallbackAvatar = "../images/user.avif";
  const personName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "Organization user";
  if (profileName) profileName.textContent = personName;
  if (profileType) profileType.textContent = user?.role || "Organization";
  if (avatar) {
    avatar.src = /^https:\/\//i.test(user?.profilePicture?.url || "") ? user.profilePicture.url : fallbackAvatar;
    avatar.alt = personName + " profile picture";
    avatar.onerror = () => { avatar.onerror = null; avatar.src = fallbackAvatar; };
  }
  if (organizationLabel) organizationLabel.textContent = "Loading organization…";

  if (welcome) welcome.textContent = `Welcome, ${[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Organization"}`;

  const get = async (path) => {
    const response = await fetch(`https://verifydoc-api-v1.onrender.com${path}`, {
      headers: { Authorization: `Bearer ${session.getToken()}` }, cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Dashboard data unavailable");
    return body.data;
  };

  try {
    const data = await get("/organization/dashboard");
    if (organizationLabel) organizationLabel.textContent = data.organization?.organizationName || "Organization";
    if (profileType) profileType.textContent = data.organization?.organizationType || user?.role || "Organization";
    const metric = (index, value, label) => {
      const card = cards[index];
      const count = card?.querySelector(".text-3xl");
      const description = card?.querySelector(".text-xs.font-medium.mt-2");
      if (count) count.textContent = value === null || value === undefined ? "—" : String(value);
      if (description) description.textContent = label;
    };
    metric(0, data.totalVerifications, "Verification analytics not yet available");
    metric(1, data.pendingRequests, "Pending fresh confirmations");
    metric(2, data.completedRequests, "Responded fresh confirmations");
    if (sharedCount) sharedCount.textContent = String(data.sharedCredentials ?? "—");
    const description = sharedCount?.nextElementSibling;
    if (description) description.textContent = "Active shared credentials";

    if (activity) {
      const entries = Array.isArray(data.recentActivity) ? data.recentActivity : [];
      if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "text-sm text-slate-500";
        empty.textContent = "No recent activity.";
        activity.append(empty);
      }
      for (const entry of entries) {
        const row = document.createElement("div");
        row.className = "flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-slate-100 gap-3";
        const left = document.createElement("div");
        const title = document.createElement("p");
        title.className = "text-sm font-semibold text-slate-800";
        title.textContent = entry.title || "Activity";
        const detail = document.createElement("p");
        detail.className = "text-xs text-slate-500";
        detail.textContent = entry.detail || "";
        left.append(title, detail);
        const right = document.createElement("div");
        right.className = "text-xs text-slate-500";
        right.textContent = `${entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ""} • ${entry.status || ""}`;
        row.append(left, right);
        activity.append(row);
      }
    }
  } catch (error) {
    if (organizationLabel) organizationLabel.textContent = "Organization unavailable";
    if (activity) {
      const notice = document.createElement("p");
      notice.className = "text-sm text-slate-500";
      notice.textContent = error.message || "Dashboard unavailable";
      activity.append(notice);
    }
  }
});
