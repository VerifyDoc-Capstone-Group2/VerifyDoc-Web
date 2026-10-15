(() => {
  "use strict";
  const email = document.getElementById("email");
  const first = document.getElementById("first-name");
  const last = document.getElementById("last-name");
  if (!email || !first || !last) return;
  const list = document.createElement("div");
  list.id = "citizen-email-suggestions";
  list.className = "mt-1 hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Registered citizen email suggestions");
  email.insertAdjacentElement("afterend", list);
  email.setAttribute("autocomplete", "off");
  email.setAttribute("aria-controls", list.id);
  const hint = document.createElement("p");
  hint.className = "mt-1 text-xs text-slate-500";
  hint.textContent = "Type at least 3 characters to find registered citizens.";
  list.insertAdjacentElement("afterend", hint);
  let requestNumber = 0;
  let timer;
  function hide() { list.classList.add("hidden"); list.replaceChildren(); }
  function message(text) {
    list.replaceChildren();
    const p = document.createElement("p");
    p.className = "px-3 py-2 text-xs text-slate-500";
    p.textContent = text;
    list.append(p);
    list.classList.remove("hidden");
  }
  async function search() {
    const current = ++requestNumber;
    const q = email.value.trim().toLowerCase();
    if (q.length < 3) { hide(); return; }
    message("Searching registered citizens…");
    const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!token) { message("Sign in as an institution to search."); return; }
    try {
      const response = await fetch("https://verifydoc-api-v1.onrender.com/credentials/recipients/search?q=" + encodeURIComponent(q), {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" },
        cache: "no-store"
      });
      const body = await response.json().catch(() => ({}));
      if (current !== requestNumber || email.value.trim().toLowerCase() !== q) return;
      if (!response.ok) throw new Error(body.message || "Search unavailable");
      if (!Array.isArray(body.data) || !body.data.length) { message("No matching registered citizens."); return; }
      list.replaceChildren();
      for (const citizen of body.data) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "block w-full border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50";
        option.setAttribute("role", "option");
        option.textContent = citizen.email + " — " + citizen.firstName + " " + citizen.lastName;
        option.addEventListener("click", () => {
          requestNumber++;
          email.value = citizen.email;
          first.value = citizen.firstName;
          last.value = citizen.lastName;
          email.dispatchEvent(new Event("input", { bubbles: true }));
          hide();
          hint.textContent = "Selected registered citizen: " + citizen.firstName + " " + citizen.lastName;
        });
        list.append(option);
      }
      list.classList.remove("hidden");
    } catch (error) {
      if (current === requestNumber) message(error.message);
    }
  }
  email.addEventListener("input", () => {
    clearTimeout(timer);
    requestNumber++;
    hint.textContent = "Type at least 3 characters to find registered citizens.";
    timer = setTimeout(search, 300);
  });
  email.addEventListener("blur", () => setTimeout(hide, 200));
})();
