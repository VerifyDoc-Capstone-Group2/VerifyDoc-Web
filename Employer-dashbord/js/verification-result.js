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

// Replace demo verification content with a backend-validated result.
document.addEventListener("DOMContentLoaded", async () => {
  const card = document.querySelector("main .bg-white.rounded-2xl");
  if (!card) return;
  const header = card.querySelector("h1");
  const subtitle = header?.nextElementSibling;
  const rows = Array.from(card.querySelectorAll(".grid.grid-cols-12"));
  const actionButtons = document.querySelector("main .grid.grid-cols-1.sm\\:grid-cols-2");
  const params = new URLSearchParams(window.location.search);
  const credentialId = params.get("credentialId");
  const token = params.get("token");

  // Never present hardcoded demo details as verified.
  rows.forEach((row) => {
    const value = row.children[1];
    if (value) value.textContent = "—";
  });
  if (actionButtons) actionButtons.hidden = true;
  if (header) {
    header.textContent = "Checking credential";
    header.className = "text-xl sm:text-2xl font-bold text-slate-900";
  }
  if (subtitle) subtitle.textContent = "Contacting VerifyDoc to validate this credential.";

  const fail = (message) => {
    if (header) {
      header.textContent = "Verification unavailable";
      header.className = "text-xl sm:text-2xl font-bold text-red-600";
    }
    if (subtitle) subtitle.textContent = message;
  };

  if (!/^VDOC-CRED-[0-9]{8}$/.test(credentialId || "") || !/^[a-f0-9]{64}$/.test(token || "")) {
    fail("A valid signed verification link is required.");
    return;
  }

  try {
    const session = window.VerifyDocOrganizationSession;
    if (!session || !(await session.ready)) return;
    const url = new URL(`https://verifydoc-api-v1.onrender.com/credentials/verify/${encodeURIComponent(credentialId)}`);
    url.searchParams.set("token", token);
    const response = await fetch(url.toString(), { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "Verification could not be completed.");
    const data = payload.data;
    if (!data || data.credentialId !== credentialId) throw new Error("Invalid verification response.");
    if (header) {
      header.textContent = data.isValid ? "Credential Verified" : "Credential Not Verified";
      header.className = `text-xl sm:text-2xl font-bold ${data.isValid ? "text-emerald-600" : "text-red-600"}`;
    }
    if (subtitle) subtitle.textContent = data.isValid
      ? "This credential is verified and active."
      : "This credential is not currently verified and active.";
    const fields = [data.title || data.credentialType, data.holderName || "Not provided", data.issuerName, data.credentialId, data.issueDate ? new Date(data.issueDate).toLocaleDateString() : "Not provided", "Not provided by verification API", data.status];
    rows.forEach((row, index) => {
      const value = row.children[1];
      if (value) value.textContent = fields[index] || "Not provided";
    });
    // Do not show the fresh-confirmation action until its request flow is integrated.
  } catch (error) {
    fail(error.message || "Unable to verify credential. Please try again.");
  }
});
