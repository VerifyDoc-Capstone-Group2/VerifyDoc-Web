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

// Prefer the native scanner; fall back to html5-qrcode on unsupported browsers.
document.addEventListener("DOMContentLoaded", async () => {
  const frame = document.querySelector(".relative.w-56.h-56");
  if (!frame) return;

  const status = document.createElement("p");
  status.className = "text-xs text-slate-200 mt-4 text-center";
  status.setAttribute("role", "status");
  frame.parentElement.appendChild(status);

  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;

  const extract = (raw) => {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return null;
      const match = new RegExp("^/verify/(VDOC-CRED-[0-9]{8})$").exec(url.pathname);
      const token = url.searchParams.get("token");
      if (!match || !/^[a-f0-9]{64}$/.test(token || "")) return null;
      return { credentialId: match[1], token };
    } catch { return null; }
  };

  let active = true;
  let stream = null;
  let fallbackScanner = null;
  let scanning = false;
  let navigating = false;
  const video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.muted = true;
  video.autoplay = true;
  video.className = "absolute inset-0 w-full h-full object-cover rounded-2xl";

  const stop = async () => {
    active = false;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (fallbackScanner && scanning) {
      scanning = false;
      try { await fallbackScanner.stop(); } catch { /* scanner already stopped */ }
    }
    if (fallbackScanner) {
      try { fallbackScanner.clear(); } catch { /* no mounted scanner */ }
    }
  };
  window.addEventListener("pagehide", () => { void stop(); }, { once: true });

  const onDecoded = (raw) => {
    if (!active || navigating) return;
    const parsed = extract(raw);
    if (!parsed) {
      status.textContent = "This QR code is not a signed VerifyDoc credential.";
      return;
    }
    navigating = true;
    void stop();
    window.location.assign("verification-result.html?" + new URLSearchParams(parsed));
  };

  if (!navigator.mediaDevices?.getUserMedia) {
    status.textContent = "Camera access is unavailable. Use the manual verification option.";
    return;
  }

  const startFallback = async () => {
    if (!active) return;
    if (typeof window.Html5Qrcode !== "function") {
      status.textContent = "QR scanning is unsupported here. Use the manual verification option.";
      return;
    }
    const holder = document.createElement("div");
    holder.id = "verifydoc-qr-fallback";
    holder.className = "absolute inset-0 w-full h-full overflow-hidden rounded-2xl";
    frame.prepend(holder);
    try {
      fallbackScanner = new window.Html5Qrcode(holder.id, { verbose: false });
      status.textContent = "Starting compatible QR scanner…";
      await fallbackScanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: (w, h) => { const side = Math.floor(Math.min(w, h) * 0.85); return { width: side, height: side }; } },
        onDecoded,
        () => {}
      );
      scanning = true;
      if (!active) await stop();
      else status.textContent = "Point the camera at a VerifyDoc QR code.";
    } catch (error) {
      if (active) {
        status.textContent = error?.name === "NotAllowedError"
          ? "Camera permission denied. Use the manual verification option."
          : "Camera scanning unavailable. Use the manual verification option.";
      }
      await stop();
    }
  };

  if (typeof window.BarcodeDetector !== "function") {
    await startFallback();
    return;
  }

  let detector;
  try {
    if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (!formats.includes("qr_code")) { await startFallback(); return; }
    }
    detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    await startFallback();
    return;
  }

  try {
    status.textContent = "Requesting camera permission…";
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    if (!active) { await stop(); return; }
    frame.prepend(video);
    video.srcObject = stream;
    await video.play();
    status.textContent = "Point the camera at a VerifyDoc QR code.";
    while (active && !navigating) {
      if (video.readyState >= 2) {
        const codes = await detector.detect(video);
        for (const code of codes) {
          onDecoded(code.rawValue);
          if (navigating) return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.remove();
    if (!active || navigating) return;
    if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
      status.textContent = "Camera permission denied. Use the manual verification option.";
      return;
    }
    await startFallback();
  }
});
