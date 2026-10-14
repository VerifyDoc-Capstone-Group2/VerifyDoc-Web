(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const tbody = document.querySelector("main table tbody");
  const search = document.querySelector('input[aria-label="Search organizations"]');
  const pills = [...document.querySelectorAll("main .mt-2.flex.gap-2 > button")];
  const dropdowns = [...document.querySelectorAll("main .dropdown")];
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  let entities = [];
  let category = "";
  let selectedType = "";
  let selectedStatus = "";
  let selectedDate = "";
  const el = (tag, classes, value) => {
    const node = document.createElement(tag);
    node.className = classes;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const formatDate = value => {
    if (!value || !Number.isFinite(new Date(value).getTime())) return "Not approved";
    return new Date(value).toLocaleDateString("en-GB");
  };
  const badge = status => {
    const colors = {
      Active: "border-green-300 bg-green-100 text-green-800",
      Suspended: "border-amber-300 bg-amber-100 text-amber-800",
      Rejected: "border-red-300 bg-red-100 text-red-800",
      "Pending Approval": "border-blue-300 bg-blue-100 text-blue-800"
    };
    return el("span", "inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold " + (colors[status] || "bg-gray-100"), status || "Unknown");
  };
  function details(entity) {
    const dialog = document.createElement("dialog");
    dialog.className = "w-[min(95vw,520px)] rounded-xl border border-slate-200 p-6 shadow-xl backdrop:bg-black/50";
    const title = el("h2", "text-xl font-semibold", entity.name);
    const desc = el("dl", "mt-5 grid grid-cols-2 gap-4 text-sm");
    for (const [label, value] of [
      ["Category", entity.entityKind],
      ["Type", entity.type],
      ["Status", entity.status],
      ["Approval date", formatDate(entity.approvedAt)],
      ["Registered", formatDate(entity.createdAt)],
      ["Registration ID", entity.id]
    ]) {
      const wrapper = el("div", "min-w-0");
      wrapper.append(el("dt", "text-slate-500", label), el("dd", "mt-1 break-words font-medium", value || "Unavailable"));
      desc.append(wrapper);
    }
    const close = el("button", "mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white", "Close");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove());
    dialog.append(title, desc, close);
    document.body.append(dialog);
    dialog.showModal();
  }
  function render() {
    const query = (search?.value || "").trim().toLowerCase();
    const filtered = entities.filter(e => {
      const categoryMatch = !category || e.entityKind === category;
      const typeMatch = !selectedType || e.entityKind === selectedType || e.type === selectedType;
      const statusMatch = !selectedStatus || e.status === selectedStatus;
      const dateMatch = !selectedDate || (e.approvedAt && formatDate(e.approvedAt) === selectedDate);
      return categoryMatch && typeMatch && statusMatch && dateMatch &&
        [e.name, e.type, e.id].some(value => String(value || "").toLowerCase().includes(query));
    });
    tbody.replaceChildren();
    if (!filtered.length) {
      const tr = el("tr", "");
      const td = el("td", "px-4 py-6 text-center text-slate-500", entities.length ? "No matching organizations or institutions." : "No registered organizations or institutions.");
      td.colSpan = 6;
      tr.append(td);
      tbody.append(tr);
      return;
    }
    for (const e of filtered) {
      const tr = el("tr", "border-b border-gray-200");
      const cells = [
        el("td", "px-4 py-3", e.name),
        el("td", "px-4 py-3", e.type || e.entityKind),
        el("td", "px-4 py-3", ""),
        el("td", "px-4 py-3", formatDate(e.approvedAt)),
        el("td", "px-4 py-3 text-xs", "Not tracked"),
        el("td", "px-4 py-3", "")
      ];
      cells[2].append(badge(e.status));
      const button = el("button", "rounded-md border border-blue-900 px-4 py-1.5 text-blue-900 hover:bg-blue-50", "View");
      button.type = "button";
      button.addEventListener("click", () => details(e));
      cells[5].append(button);
      tr.append(...cells);
      tbody.append(tr);
    }
  }
  function initFilters() {
    const all = () => entities.length;
    const orgs = () => entities.filter(e => e.entityKind === "Organization").length;
    const inst = () => entities.filter(e => e.entityKind === "Institution").length;
    const updatePills = () => {
      [all(), inst(), orgs()].forEach((count, i) => {
        pills[i].textContent = [`All (${count})`, `Institution (${count})`, `Organization (${count})`][i];
        const active = category === ["", "Institution", "Organization"][i];
        pills[i].className = "rounded-full px-3 py-1 text-xs font-semibold " + (active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900");
      });
    };
    pills.forEach((button, i) => button.addEventListener("click", () => {
      category = ["", "Institution", "Organization"][i];
      updatePills();
      render();
    }));
    search?.addEventListener("input", render);
    dropdowns.forEach((dropdown, index) => {
      const button = dropdown.querySelector(".dropdown-btn");
      const menu = dropdown.querySelector(".menu");
      const label = dropdown.querySelector(".label");
      const defaultLabel = ["Type", "Approval date", "Status"][index];
      button.addEventListener("click", event => {
        event.stopPropagation();
        dropdowns.forEach(other => { if (other !== dropdown) other.querySelector(".menu").classList.add("hidden"); });
        menu.classList.toggle("hidden");
      });
      menu.addEventListener("click", event => {
        const option = event.target.closest("li[data-value]");
        if (!option) return;
        const value = option.dataset.value || "";
        if (index === 0) selectedType = value;
        if (index === 1) selectedDate = value;
        if (index === 2) selectedStatus = value;
        label.textContent = value || defaultLabel;
        menu.classList.add("hidden");
        render();
      });
    });
    document.addEventListener("click", () => dropdowns.forEach(d => d.querySelector(".menu").classList.add("hidden")));
    updatePills();
  }
  async function load() {
    tbody.replaceChildren();
    const tr = el("tr", "");
    const td = el("td", "px-4 py-6 text-center text-slate-500", "Loading registered entities…");
    td.colSpan = 6;
    tr.append(td);
    tbody.append(tr);
    try {
      if (!token) throw new Error("Please sign in as an administrator.");
      const response = await fetch(API + "/admin/entities", {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store"
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Directory request failed (" + response.status + ")");
      if (!Array.isArray(json.data?.entities)) throw new Error("Invalid directory response.");
      entities = json.data.entities;
      const dateMenu = dropdowns[1]?.querySelector(".menu");
      if (dateMenu) {
        dateMenu.replaceChildren();
        const option = (value, label) => {
          const item = el("li", "cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm text-white hover:bg-gray-800", label);
          item.dataset.value = value;
          dateMenu.append(item);
        };
        option("", "All dates");
        [...new Set(entities.filter(e => e.approvedAt).map(e => formatDate(e.approvedAt)))].sort().reverse().forEach(d => option(d, d));
      }
      const typeMenu = dropdowns[0]?.querySelector(".menu");
      if (typeMenu) {
        typeMenu.replaceChildren();
        for (const value of ["", "Institution", ...new Set(entities.filter(e => e.entityKind === "Organization").map(e => e.type))]) {
          const item = el("li", "cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm text-white hover:bg-gray-800", value || "All types");
          item.dataset.value = value;
          typeMenu.append(item);
        }
      }
      const statusMenu = dropdowns[2]?.querySelector(".menu");
      if (statusMenu) {
        statusMenu.replaceChildren();
        for (const value of ["", "Active", "Pending Approval", "Suspended", "Rejected"]) {
          const item = el("li", "cursor-pointer whitespace-nowrap rounded-md px-3 py-2 text-sm text-white hover:bg-gray-800", value || "All statuses");
          item.dataset.value = value;
          statusMenu.append(item);
        }
      }
      initFilters();
      render();
    } catch (error) {
      td.textContent = "Unable to load organizations: " + error.message;
    }
  }
  const open = document.getElementById("openBtn");
  const close = document.getElementById("closeBtn");
  const overlay = document.getElementById("overlay");
  const menu = document.getElementById("mobileMenu");
  open?.addEventListener("click", () => { menu?.classList.remove("hidden"); overlay?.classList.remove("hidden"); });
  const closeMenu = () => { menu?.classList.add("hidden"); overlay?.classList.add("hidden"); };
  close?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click", closeMenu);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
