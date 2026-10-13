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


// Decode a QR screenshot locally and verify its signed payload without using a camera.
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("qrImageFile");
  const button = document.getElementById("qrImageVerifyButton");
  const message = document.getElementById("qrImageMessage");
  if (!fileInput || !button || !message) return;

  button.addEventListener("click", async () => {
    const file = fileInput.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      message.textContent = "Choose an image containing a VerifyDoc QR code.";
      return;
    }
    button.disabled = true;
    message.textContent = "Reading QR image…";
    let scanner;
    let objectUrl;
    try {
      const session = window.VerifyDocOrganizationSession;
      if (!session || !(await session.ready)) throw new Error("Sign in with an approved organization account first.");
      let raw;
      if (typeof window.BarcodeDetector === "function") {
        try {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const bitmap = await createImageBitmap(file);
          try {
            const codes = await detector.detect(bitmap);
            raw = codes.find(code => code.rawValue)?.rawValue;
          } finally { bitmap.close(); }
        } catch { /* Fall back to html5-qrcode. */ }
      }
      if (!raw && typeof window.Html5Qrcode === "function") {
        const holder = document.createElement("div");
        holder.id = "verifydoc-image-reader";
        holder.hidden = true;
        document.body.appendChild(holder);
        try {
          scanner = new window.Html5Qrcode(holder.id, { verbose: false });
          raw = await scanner.scanFile(file, false);
        } finally {
          try { scanner?.clear(); } catch {}
          holder.remove();
        }
      }
      if (!raw) throw new Error("No QR code found in this image. Try a clearer screenshot.");
      const url = new URL(raw);
      const match = new RegExp("^/verify/(VDOC-CRED-[0-9]{8})$").exec(url.pathname);
      const token = url.searchParams.get("token");
      const protocolValid = url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
      if (!protocolValid || !match || !/^[a-f0-9]{64}$/.test(token || "")) {
        throw new Error("This image does not contain a valid signed VerifyDoc link.");
      }
      const destination = new URL("verification-result.html", window.location.href);
      destination.searchParams.set("credentialId", match[1]);
      destination.searchParams.set("token", token);
      window.location.assign(destination.href);
    } catch (error) {
      message.textContent = error.message || "Unable to read QR image.";
    } finally {
      button.disabled = false;
    }
  });
});
