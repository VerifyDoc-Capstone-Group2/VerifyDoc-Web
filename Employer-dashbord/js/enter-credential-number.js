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

// Verify a signed VerifyDoc link without weakening the backend token requirement.
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("credential-number");
  const link = document.querySelector('a[href="verification-result.html"]');
  if (!input || !link) return;

  const message = document.createElement("p");
  message.setAttribute("role", "alert");
  message.className = "text-xs text-red-600 mt-2";
  message.hidden = true;
  input.insertAdjacentElement("afterend", message);

  const parseVerificationLink = (value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return null;
      const match = /^\\/(?:credentials\\/verify|verify)\\/(VDOC-CRED-[0-9]{8})$/.exec(url.pathname);
      if (url.pathname.startsWith("/credentials/verify/") && url.origin !== "https://verifydoc-api-v1.onrender.com") return null;
      const token = url.searchParams.get("token");
      if (!match || !/^[a-f0-9]{64}$/.test(token || "")) return null;
      return { credentialId: match[1], token };
    } catch { return null; }
  };

  link.addEventListener("click", (event) => {
    event.preventDefault();
    message.hidden = true;
    const parsed = parseVerificationLink(input.value.trim());
    if (!parsed) {
      message.textContent = "Enter a valid signed VerifyDoc verification URL. A credential number alone cannot be verified with the current API.";
      message.hidden = false;
      return;
    }
    const query = new URLSearchParams(parsed);
    window.location.href = `verification-result.html?${query.toString()}`;
  });
});
