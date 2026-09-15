const { createClient } = window.supabase;

const cfg = window.WEDDING_CONFIG?.supabase;
const $ = id => document.getElementById(id);
const $$ = selector => [...document.querySelectorAll(selector)];

if (!cfg?.url || !cfg?.publishableKey) {
  document.body.innerHTML = '<p style="padding:30px;color:white">Không đọc được config.js. Hãy kiểm tra file config.js ở thư mục gốc.</p>';
  throw new Error("Missing Supabase config");
}

const sb = createClient(cfg.url, cfg.publishableKey);

const loginView = $("loginView");
const appView = $("appView");
const mediaList = $("mediaList");

let currentStatus = "pending";
let currentItems = [];

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("loginError").textContent = "";

  const button = event.currentTarget.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "ĐANG ĐĂNG NHẬP…";

  const { error } = await sb.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  button.disabled = false;
  button.textContent = "ĐĂNG NHẬP";

  if (error) {
    $("loginError").textContent = "Đăng nhập chưa thành công. Vui lòng kiểm tra email và mật khẩu.";
  }
});

$("logoutBtn").addEventListener("click", () => sb.auth.signOut());
$("refreshBtn").addEventListener("click", loadDashboard);

$$(".tab").forEach(button => {
  button.addEventListener("click", () => {
    $$(".tab").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentStatus = button.dataset.status;
    loadMedia(currentStatus);
  });
});

$("closePreview").addEventListener("click", closePreview);
$("previewModal").addEventListener("click", event => {
  if (event.target === $("previewModal")) closePreview();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closePreview();
});

sb.auth.onAuthStateChange(async (_event, session) => {
  if (!session) {
    loginView.classList.remove("hidden");
    appView.classList.add("hidden");
    return;
  }

  // Chỉ cho phép user có trong bảng admin_users.
  const { data: adminUser, error } = await sb
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error || !adminUser) {
    await sb.auth.signOut();
    $("loginError").textContent =
      "Tài khoản này chưa được cấp quyền quản trị. Nếu đây là tài khoản của hai bạn, hãy kiểm tra bảng admin_users trong Supabase.";
    return;
  }

  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  $("adminEmail").textContent = session.user.email || "";

  await loadDashboard();
});

async function loadDashboard() {
  await Promise.all([
    loadStats(),
    loadMedia(currentStatus),
    loadRsvps()
  ]);
}

async function loadStats() {
  const [pending, approved, rejected, rsvps] = await Promise.all([
    sb.from("media").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("media").select("id", { count: "exact", head: true }).eq("status", "approved"),
    sb.from("media").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    sb.from("rsvps").select("id", { count: "exact", head: true })
  ]);

  $("pendingCount").textContent = pending.count ?? 0;
  $("approvedCount").textContent = approved.count ?? 0;
  $("rejectedCount").textContent = rejected.count ?? 0;
  $("rsvpCount").textContent = rsvps.count ?? 0;
}

async function loadMedia(status) {
  mediaList.innerHTML = '<p class="muted">Đang tải…</p>';

  const { data, error } = await sb
    .from("media")
    .select("id,created_at,file_url,file_type,guest_name,message,source,status,caption,featured")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    mediaList.innerHTML = `<div class="empty-state">Không tải được dữ liệu.<br>${escapeHtml(error.message)}</div>`;
    return;
  }

  currentItems = data || [];
  renderMedia(currentItems);
}

function renderMedia(items) {
  if (!items.length) {
    const labels = {
      pending: "Hiện không có ảnh/video chờ duyệt 🎉",
      approved: "Chưa có nội dung đã duyệt.",
      rejected: "Chưa có nội dung bị từ chối."
    };
    mediaList.innerHTML = `<div class="empty-state">${labels[currentStatus]}</div>`;
    return;
  }

  mediaList.innerHTML = items.map(item => {
    const isVideo = item.file_type === "video";
    const src = escapeAttr(item.file_url || "");
    const media = isVideo
      ? `<video muted preload="metadata" src="${src}"></video>`
      : `<img loading="lazy" src="${src}" alt="">`;

    return `
      <article class="media-card">
        <div class="media-preview" onclick="openPreview('${item.id}')">
          ${media}
          <span class="media-type">${isVideo ? "VIDEO" : "ẢNH"}</span>
        </div>

        <div class="media-info">
          <strong>${escapeHtml(item.guest_name || "Khách mời")}</strong>
          <time>${formatDate(item.created_at)}</time>
          <div class="message">${escapeHtml(item.message || "Không có lời nhắn.")}</div>
          ${renderActions(item)}
        </div>
      </article>
    `;
  }).join("");
}

function renderActions(item) {
  if (item.status === "pending") {
    return `
      <div class="actions">
        <button class="action-btn approve" onclick="setStatus('${item.id}','approved')">DUYỆT</button>
        <button class="action-btn reject" onclick="setStatus('${item.id}','rejected')">TỪ CHỐI</button>
      </div>
    `;
  }

  if (item.status === "approved") {
    return `
      <div class="actions">
        <button class="action-btn reject restore" onclick="setStatus('${item.id}','rejected')">CHUYỂN SANG TỪ CHỐI</button>
      </div>
    `;
  }

  return `
    <div class="actions">
      <button class="action-btn approve restore" onclick="setStatus('${item.id}','approved')">DUYỆT LẠI</button>
    </div>
  `;
}

window.setStatus = async (id, status) => {
  const label = status === "approved" ? "duyệt nội dung này" : "từ chối nội dung này";
  if (!confirm(`Bạn có chắc muốn ${label}?`)) return;

  const { error } = await sb
    .from("media")
    .update({ status })
    .eq("id", id);

  if (error) {
    showToast("Không cập nhật được: " + error.message);
    return;
  }

  showToast(status === "approved" ? "Đã duyệt nội dung ✓" : "Đã chuyển sang từ chối.");
  await Promise.all([loadStats(), loadMedia(currentStatus)]);
};

window.openPreview = id => {
  const item = currentItems.find(row => String(row.id) === String(id));
  if (!item) return;

  const isVideo = item.file_type === "video";
  $("previewContent").innerHTML = isVideo
    ? `<video controls autoplay playsinline src="${escapeAttr(item.file_url || "")}"></video>`
    : `<img src="${escapeAttr(item.file_url || "")}" alt="">`;

  $("previewModal").classList.remove("hidden");
  $("previewModal").setAttribute("aria-hidden", "false");
};

function closePreview() {
  $("previewModal").classList.add("hidden");
  $("previewModal").setAttribute("aria-hidden", "true");
  $("previewContent").innerHTML = "";
}

async function loadRsvps() {
  const { data, error } = await sb
    .from("rsvps")
    .select("created_at,name,attending,guests,message")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    $("rsvpList").innerHTML =
      `<tr><td colspan="5" class="error">${escapeHtml(error.message)}</td></tr>`;
    return;
  }

  const items = data || [];

  $("rsvpList").innerHTML = items.length
    ? items.map(row => `
        <tr>
          <td>${formatDate(row.created_at)}</td>
          <td>${escapeHtml(row.name || "")}</td>
          <td>${row.attending ? "Có ❤️" : "Không"}</td>
          <td>${Number(row.guests || 1)}</td>
          <td>${escapeHtml(row.message || "")}</td>
        </tr>
      `).join("")
    : '<tr><td colspan="5" class="muted">Chưa có xác nhận tham dự.</td></tr>';
}

function showToast(text) {
  const toast = $("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value || "";
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}
