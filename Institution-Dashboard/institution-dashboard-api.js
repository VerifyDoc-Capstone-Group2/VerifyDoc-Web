(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const overview = [...document.querySelectorAll('section[aria-label="Overview"] > div')];
  const activity = document.querySelector('[role="table"][aria-label="Recent verification activity"]');
  const heading = document.querySelector("main h1");
  const headingRow = activity?.querySelector('[role="row"][class*="hidden"]');
  const make = (tag, classes, value) => {
    const el = document.createElement(tag);
    el.className = classes;
    if (value !== undefined) el.textContent = String(value);
    return el;
  };
  const number = (index, value) => {
    const el = overview[index]?.querySelector("p.text-statnum");
    if (el) el.textContent = String(value);
  };
  const date = input => {
    const d = new Date(input);
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "Date unavailable";
  };
  const statusColors = {
    Verified: "border-green-300 bg-green-100 text-green-800",
    Confirmed: "border-green-300 bg-green-100 text-green-800",
    Pending: "border-amber-400 bg-amber-100 text-amber-800",
    Rejected: "border-red-300 bg-red-100 text-red-700",
    Revoked: "border-red-300 bg-red-100 text-red-700",
    Disputed: "border-red-300 bg-red-100 text-red-700"
  };
  function renderActivity(items) {
    if (!activity) return;
    activity.replaceChildren();
    if (headingRow) activity.append(headingRow);
    if (!items.length) {
      activity.append(make("p", "px-4 py-6 text-sm text-neutral-500", "No recent verification activity."));
      return;
    }
    for (const item of items.slice(0, 6)) {
      const row = make("div", "grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-neutral-300 px-1 py-4 text-td text-neutral-500 md:grid-cols-4 md:items-center md:px-[16px] md:min-h-[75px]");
      row.setAttribute("role", "row");
      const cells = [
        make("div", "col-span-2 font-medium text-neutral-900 md:col-span-1 md:font-normal md:text-neutral-500", item.action),
        make("div", "", item.title),
        make("div", "", date(item.createdAt)),
        make("div", "col-span-2 md:col-span-1")
      ];
      cells.forEach(cell => cell.setAttribute("role", "cell"));
      cells[3].append(make("span", "inline-flex items-center rounded-full border px-2 py-0.5 text-sm font-semibold " + (statusColors[item.status] || statusColors.Pending), item.status));
      row.append(...cells);
      activity.append(row);
    }
  }
  async function get(path) {
    const response = await fetch(API + path, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      cache: "no-store"
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed (" + response.status + ")");
    return body.data;
  }
  async function all(path, key) {
    let page = 1, pages = 1, result = [];
    do {
      const join = path.includes("?") ? "&" : "?";
      const data = await get(path + join + "page=" + page + "&limit=50");
      if (!Array.isArray(data?.[key])) throw new Error("Unexpected " + key + " response");
      result.push(...data[key]);
      pages = data.pagination?.totalPages || 1;
      page++;
    } while (page <= pages);
    return result;
  }
  function updateIdentity(user) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "User";
    if (heading) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      heading.textContent = greeting + ", " + name;
    }
    document.querySelectorAll("aside, #mobileMenu").forEach(panel => {
      const button = panel.querySelector('button[aria-label="Log out"]');
      const label = button?.previousElementSibling?.querySelector("span.text-lg");
      if (label) label.textContent = name;
    });
    const topLabel = document.querySelector("section.min-w-0 > div.flex.justify-between p.font-semibold");
    if (topLabel) topLabel.textContent = name;
  }
  async function run() {
    overview.forEach((_, i) => number(i, "—"));
    renderActivity([]);
    if (!token) {
      renderActivity([{ action: "Sign in required", title: "Please sign in to view institution data", status: "Pending", createdAt: new Date() }]);
      return;
    }
    const [profile, credentials, confirmations] = await Promise.allSettled([
      get("/auth/me"),
      all("/credentials/institution?view=all", "credentials"),
      all("/credential-confirmations/institution", "requests")
    ]);
    if (profile.status === "fulfilled" && profile.value) updateIdentity(profile.value);
    const items = [];
    if (credentials.status === "fulfilled") {
      const list = credentials.value;
      number(0, list.filter(c => c.source === "Institution").length);
      number(1, list.filter(c => c.verificationStatus === "Verified" && c.status === "Active").length);
      number(3, list.filter(c => c.source === "Citizen" && c.verificationStatus === "Pending" && c.status === "Active").length);
      for (const c of list) {
        items.push({
          action: c.source === "Citizen" ? "Citizen credential review" : "Credential issued",
          title: c.title || c.credentialType || c.credentialId || "Credential",
          status: c.status === "Revoked" ? "Revoked" : c.verificationStatus || "Pending",
          createdAt: c.updatedAt || c.createdAt
        });
      }
    }
    if (confirmations.status === "fulfilled") {
      const requests = confirmations.value;
      number(2, requests.filter(r => r.status === "Pending").length);
      for (const r of requests) {
        items.push({
          action: "Fresh confirmation request",
          title: "Credential confirmation",
          status: r.status || "Pending",
          createdAt: r.respondedAt || r.createdAt
        });
      }
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    renderActivity(items);
    if (credentials.status === "rejected" || confirmations.status === "rejected") {
      const message = [credentials, confirmations].filter(x => x.status === "rejected").map(x => x.reason.message).join("; ");
      activity?.prepend(make("p", "px-4 py-2 text-sm text-red-700", "Some dashboard data is unavailable: " + message));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
