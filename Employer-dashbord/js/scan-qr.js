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

// Camera QR scanning uses the native BarcodeDetector API when available.
document.addEventListener("DOMContentLoaded", async () => {
  const frame = document.querySelector(".relative.w-56.h-56");
  if (!frame) return;
  const status = document.createElement("p");
  status.className = "text-xs text-slate-200 mt-4 text-center";
  status.setAttribute("role", "status");
  frame.parentElement.appendChild(status);

  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;

  if (!navigator.mediaDevices?.getUserMedia || typeof BarcodeDetector === "undefined") {
    status.textContent = "Camera QR scanning is not supported in this browser. Use the manual verification option.";
    return;
  }
  let detector;
  try {
    detector = new BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    status.textContent = "QR scanning is unavailable on this device.";
    return;
  }

  let stream;
  let active = true;
  const video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.muted = true;
  video.autoplay = true;
  video.className = "absolute inset-0 w-full h-full object-cover rounded-2xl";
  frame.prepend(video);
  const stop = () => {
    active = false;
    stream?.getTracks().forEach((track) => track.stop());
  };
  window.addEventListener("pagehide", stop, { once: true });

  const extract = (raw) => {
    try {
      const url = new URL(raw);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return null;
      const match = /^\/verify\/(VDOC-CRED-[0-9]{8})$/.exec(url.pathname);
      const token = url.searchParams.get("token");
      if (!match || !/^[a-f0-9]{64}$/.test(token || "")) return null;
      return { credentialId: match[1], token };
    } catch { return null; }
  };

  try {
    status.textContent = "Requesting camera permission…";
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    if (!active) { stop(); return; }
    video.srcObject = stream;
    await video.play();
    status.textContent = "Point the camera at a VerifyDoc QR code.";
    while (active) {
      if (video.readyState >= 2) {
        const codes = await detector.detect(video);
        for (const code of codes) {
          const parsed = extract(code.rawValue);
          if (parsed) {
            stop();
            window.location.assign(`verification-result.html?${new URLSearchParams(parsed)}`);
            return;
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } catch (error) {
    status.textContent = error.name === "NotAllowedError"
      ? "Camera permission denied. Use the manual verification option."
      : "Camera scanning could not start. Use the manual verification option.";
    stop();
  }
});
