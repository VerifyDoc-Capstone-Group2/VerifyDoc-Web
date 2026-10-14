(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const list = document.getElementById("credentialList");
  const search = document.getElementById("credentialSearch");
  const type = document.getElementById("typeFilter");
  const status = document.getElementById("statusFilter");
  const dateFilters = [document.getElementById("dateFilterDesktop"), document.getElementById("dateFilterMobile")];
  const empty = document.getElementById("emptyState");
  const noCredentials = document.getElementById("noCredentialsState");
  const wallet = document.getElementById("walletContent");
  const loading = document.getElementById("loadingState");
  const apply = document.getElementById("applyFilters");
  const reset = document.getElementById("resetFilters");
  let credentials = [];
  let busy = false;
  const element = (tag, classes, value) => {
    const el = document.createElement(tag);
    el.className = classes;
    if (value !== undefined) el.textContent = String(value);
    return el;
  };
  const show = (node, visible) => node?.classList.toggle("hidden", !visible);
  const normalized = value => String(value || "").toLowerCase();
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();

  // Credential expiry is not present in the wallet API. Never imply a date.
  for (const select of dateFilters) {
    if (!select) continue;
    select.disabled = true;
    select.title = "Credential expiry dates are not yet supported";
    for (const option of select.options) if (option.value) option.disabled = true;
  }
  // The backend supports Pending, Verified, Rejected and Revoked, not Expired.
  if (status) {
    const expired = status.querySelector('option[value="expired"]');
    if (expired) { expired.disabled = true; expired.textContent = "Expired (unavailable)"; }
    const uploaded = status.querySelector('option[value="uploaded"]');
    if (uploaded) uploaded.textContent = "Citizen uploaded";
    for (const [value, label] of [["rejected", "Rejected"], ["revoked", "Revoked"]]) {
      if (![...status.options].some(o => o.value === value)) status.add(new Option(label, value));
    }
  }

  const view = credential => {
    const params = new URLSearchParams({
      id: credential.credentialId || "",
      credentialId: credential.credentialId || "",
      name: credential.title || "",
      institution: credential.issuerName || "",
      status: credential.status === "Revoked" ? "Revoked" : credential.verificationStatus || "Pending",
      expiry: "Not available",
      type: credential.credentialType || ""
    });
    window.location.href = "./Credential-Details.html?" + params;
  };
  function makeRow(credential) {
    const row = element("li", "wallet-row gap-x-3 rounded-lg border border-[#D4D4D4] bg-blue-50 px-3 py-5 md:gap-x-2 md:rounded-md md:border-[#D4D4D4] md:bg-white md:px-2 md:py-2.5 lg:py-5");
    row.tabIndex = 0;
    const identity = element("div", "flex min-w-0 items-center gap-3");
    const icon = element("span", "grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 md:hidden");
    icon.innerHTML = '<i data-lucide="scroll-text" class="h-4 w-4"></i>';
    const info = element("div", "min-w-0");
    const titles = element("div", "flex flex-col gap-2");
    titles.append(element("p", "truncate text-xs font-medium text-black md:text-xs lg:text-[18px]", credential.title || credential.credentialType || "Credential"));
    titles.append(element("span", "desktop-cell truncate text-base text-[#737373]", credential.issuerName || "Issuer unavailable"));
    info.append(titles);
    info.append(element("p", "mobile-subtitle mt-0.5 truncate text-[10px] text-slate-500 md:hidden", credential.issuerName || "Issuer unavailable"));
    info.append(element("p", "mobile-subtitle mt-0.5 truncate text-[10px] text-slate-500 md:hidden", credential.credentialId || ""));
    identity.append(icon, info);
    const effectiveStatus = credential.status === "Revoked" ? "Revoked" : credential.verificationStatus || "Pending";
    const colors = { Verified: "bg-emerald-100 text-emerald-700", Pending: "bg-amber-100 text-amber-700", Rejected: "bg-red-100 text-red-700", Revoked: "bg-red-100 text-red-700" };
    const badgeWrap = element("span", "justify-self-end md:justify-self-start");
    badgeWrap.append(element("span", "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium " + (colors[effectiveStatus] || colors.Pending), effectiveStatus));
    const expiry = element("span", "desktop-cell text-xs text-slate-500", "Not available");
    const review = element("button", "review-button hidden col-start-2 row-start-2 inline-flex justify-self-end rounded border border-blue-600 px-3 py-1.5 text-[10px] font-medium text-blue-700 hover:bg-blue-50 md:col-auto md:row-auto md:inline-flex md:justify-self-center md:text-xs", "Review");
    review.type = "button";
    review.addEventListener("click", event => { event.stopPropagation(); view(credential); });
    row.addEventListener("click", event => { if (!event.target.closest("button")) view(credential); });
    row.addEventListener("keydown", event => { if (event.key === "Enter" && event.target === row) view(credential); });
    row.append(identity, badgeWrap, expiry, review);
    return row;
  }
  function render() {
    if (busy) return;
    const query = normalized(search?.value.trim());
    const selectedType = normalized(type?.value);
    const selectedStatus = normalized(status?.value);
    const matches = credentials.filter(c => {
      const content = normalized([c.title, c.issuerName, c.credentialType, c.credentialId, c.fieldOfStudy].join(" "));
      const kind = normalized(c.credentialType);
      const state = normalized(c.status === "Revoked" ? "Revoked" : c.verificationStatus);
      return content.includes(query) &&
        (!selectedType || kind.includes(selectedType)) &&
        (!selectedStatus || (selectedStatus === "uploaded" ? c.source === "Citizen" : state === selectedStatus));
    });
    list.replaceChildren(...matches.map(makeRow));
    show(noCredentials, credentials.length === 0);
    show(wallet, credentials.length !== 0);
    show(empty, credentials.length !== 0 && matches.length === 0);
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
  async function load() {
    busy = true;
    show(wallet, false);
    show(noCredentials, false);
    show(loading, true);
    try {
      const auth = token();
      if (!auth) throw new Error("Please sign in to view your credentials.");
      const result = [];
      let page = 1;
      let totalPages = 1;
      do {
        const response = await fetch(API + "/credentials/wallet?page=" + page + "&limit=50", {
          headers: { Authorization: "Bearer " + auth, Accept: "application/json" },
          cache: "no-store"
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.message || "Wallet request failed (" + response.status + ")");
        if (!Array.isArray(json.data?.credentials)) throw new Error("Unexpected wallet response.");
        result.push(...json.data.credentials);
        totalPages = json.data.pagination?.totalPages || 1;
        page++;
      } while (page <= totalPages);
      credentials = result;
      busy = false;
      show(loading, false);
      render();
    } catch (error) {
      busy = false;
      show(loading, false);
      show(wallet, true);
      list.replaceChildren();
      show(empty, true);
      empty.textContent = "Unable to load credentials: " + error.message;
      show(noCredentials, false);
    }
  }
  for (const control of [search, type, status]) {
    control?.addEventListener(control === search ? "input" : "change", render);
  }
  apply?.addEventListener("click", render);
  reset?.addEventListener("click", () => {
    if (search) search.value = "";
    if (type) type.value = "";
    if (status) status.value = "";
    dateFilters.forEach(select => { if (select) select.value = ""; });
    render();
  });
  load();
})();
