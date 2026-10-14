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

// Load only shares the authenticated organization is permitted to access.
document.addEventListener("DOMContentLoaded", async () => {
  const card = document.querySelector("main .bg-white.rounded-xl");
  const list = card?.querySelector(".divide-y");
  const footer = card?.querySelector(".border-t");
  const search = document.querySelector('input[placeholder="Search credentials..."]');
  if (!list || !footer) return;

  // Remove demo entries immediately; never display fictional shares as real records.
  list.replaceChildren();
  footer.replaceChildren();
  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;

  let page = 1;
  let shares = [];
  const limit = 10;
  const notice = (message) => {
    list.replaceChildren();
    const p = document.createElement("p");
    p.className = "p-6 text-sm text-slate-500";
    p.textContent = message;
    list.appendChild(p);
  };
  const date = (value) => value ? new Date(value).toLocaleDateString() : "—";
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const render = () => {
    list.replaceChildren();
    const term = (search?.value || "").trim().toLowerCase();
    const visible = shares.filter((share) =>
      [share.credential?.credentialId, share.credential?.title, share.credential?.issuerName]
        .some((value) => String(value || "").toLowerCase().includes(term))
    );
    if (!visible.length) { notice(term ? "No matching credentials on this page." : "No active shared credentials found."); return; }
    for (const share of visible) {
      const credential = share.credential || {};
      const row = element("div", "p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/80 transition gap-3 sm:gap-0");
      const left = element("div", "flex items-center gap-3 sm:gap-4");
      const icon = element("div", "w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0");
      icon.textContent = "▣";
      const detail = document.createElement("div");
      detail.append(element("h3", "text-sm font-semibold text-slate-900", credential.title || credential.credentialType || "Credential"));
      detail.append(element("p", "text-xs text-slate-500 mt-0.5", [credential.credentialId, credential.issuerName].filter(Boolean).join(" — ")));
      left.append(icon, detail);
      const right = element("div", "flex items-center justify-between sm:justify-end gap-3 sm:gap-6 lg:gap-12 pl-13 sm:pl-0");
      right.append(element("span", "text-xs font-medium px-3 py-1 rounded-full bg-[#E6F8F3] text-[#0D9488]", share.status || "Active"));
      const dates = element("div", "text-xs text-slate-500 text-right leading-relaxed hidden md:block");
      dates.append(element("p", "", `Shared: ${date(share.createdAt)}`), element("p", "", `Expires: ${date(share.expiresAt)}`));
      right.append(dates);
      const view = element("button", "px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition shrink-0", "View");
      view.type = "button";
      view.addEventListener("click", async () => {
        view.disabled = true;
        try {
          const response = await fetch(`https://verifydoc-api-v1.onrender.com/credential-shares/organization/${encodeURIComponent(share.shareId)}`, {
            headers: { Authorization: `Bearer ${session.getToken()}` },
            cache: "no-store"
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.message || "Unable to load shared credential");
          const item = body.data;
          window.alert([`Credential: ${item.credential?.title || "—"}`, `ID: ${item.credential?.credentialId || "—"}`, `Issuer: ${item.credential?.issuerName || "—"}`, `Verification: ${item.credential?.verificationStatus || "—"}`, `Status: ${item.status || "—"}`, `Purpose: ${item.purpose || "—"}`, `Expires: ${date(item.expiresAt)}`].join("\n"));
        } catch (error) { window.alert(error.message || "Unable to load shared credential"); }
        finally { view.disabled = false; }
      });
      right.append(view);
      const request = element("a", "px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition shrink-0", "Request Confirmation");
      request.href = `request-fresh-confirmation.html?shareId=${encodeURIComponent(share.shareId)}`;
      right.append(request);
      row.append(left, right);
      list.append(row);
    }
  };

  const load = async () => {
    notice("Loading shared credentials…");
    footer.replaceChildren();
    try {
      const response = await fetch(`https://verifydoc-api-v1.onrender.com/credential-shares/organization?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${session.getToken()}` },
        cache: "no-store"
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to retrieve shares");
      shares = Array.isArray(body.data?.shares) ? body.data.shares : [];
      render();
      const pagination = element("div", "flex items-center gap-2");
      const prev = element("button", "px-3 py-1 rounded-md border border-slate-200 disabled:opacity-40", "Previous");
      prev.disabled = page <= 1;
      prev.onclick = () => { page--; load(); };
      const next = element("button", "px-3 py-1 rounded-md border border-slate-200 disabled:opacity-40", "Next");
      next.disabled = shares.length < limit;
      next.onclick = () => { page++; load(); };
      pagination.append(prev, element("span", "text-xs", `Page ${page}`), next);
      footer.append(pagination, element("p", "text-xs text-slate-500", `Showing ${shares.length} active shares`));
    } catch (error) { notice(error.message || "Unable to retrieve shared credentials."); }
  };
  search?.addEventListener("input", render);
  await load();
});
