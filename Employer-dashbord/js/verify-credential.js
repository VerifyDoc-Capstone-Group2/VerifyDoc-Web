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

// Verify the signed payload already encoded in a QR code without camera scanning.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sameScreenVerifyForm");
  const input = document.getElementById("sameScreenVerifyUrl");
  const message = document.getElementById("sameScreenVerifyMessage");
  if (!form || !input || !message) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const session = window.VerifyDocOrganizationSession;
    if (!session || !(await session.ready)) {
      message.textContent = "Sign in with an approved organization account first.";
      return;
    }
    try {
      const url = new URL(input.value.trim());
      const allowedProtocol = url.protocol === "https:" ||
        (url.protocol === "http:" && url.hostname === "localhost");
      const match = new RegExp("^/verify/(VDOC-CRED-[0-9]{8})$").exec(url.pathname);
      const token = url.searchParams.get("token");
      if (!allowedProtocol || !match || !/^[a-f0-9]{64}$/.test(token || "")) {
        throw new Error("Enter a valid signed VerifyDoc verification link.");
      }
      const destination = new URL("verification-result.html", window.location.href);
      destination.searchParams.set("credentialId", match[1]);
      destination.searchParams.set("token", token);
      window.location.assign(destination.href);
    } catch (error) {
      message.textContent = error.message || "Invalid verification link.";
    }
  });
});
