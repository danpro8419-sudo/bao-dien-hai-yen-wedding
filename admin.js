const { createClient } = window.supabase;
const cfg = window.WEDDING_CONFIG.supabase;
const sb = createClient(cfg.url, cfg.publishableKey);

const $ = id => document.getElementById(id);
const loginView = $("loginView"), appView = $("appView");

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginError").textContent = "";
  const { error } = await sb.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });
  if (error) $("loginError").textContent = error.message;
});

$("logoutBtn").addEventListener("click", () => sb.auth.signOut());
$("refreshBtn").addEventListener("click", loadDashboard);

sb.auth.onAuthStateChange(async (_event, session) => {
  if (!session) {
    loginView.classList.remove("hidden"); appView.classList.add("hidden"); return;
  }
  const { data: admin, error } = await sb.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
  if (error || !admin) {
    await sb.auth.signOut();
    $("loginError").textContent = "Tài khoản này chưa được cấp quyền Admin.";
    return;
  }
  loginView.classList.add("hidden"); appView.classList.remove("hidden");
  $("adminEmail").textContent = session.user.email || "";
  loadDashboard();
});

async function loadDashboard(){
  $("pendingList").innerHTML = '<p class="muted">Đang tải…</p>';
  const [pending, approved, rsvps] = await Promise.all([
    sb.from("media").select("*").eq("status","pending").order("created_at",{ascending:false}),
    sb.from("media").select("id",{count:"exact",head:true}).eq("status","approved"),
    sb.from("rsvps").select("*").order("created_at",{ascending:false})
  ]);
  if (pending.error) { $("pendingList").innerHTML = `<p class="error">${escapeHtml(pending.error.message)}</p>`; return; }
  $("pendingCount").textContent = pending.data.length;
  $("approvedCount").textContent = approved.count ?? 0;
  $("rsvpCount").textContent = rsvps.data?.length ?? 0;
  renderPending(pending.data);
  renderRsvps(rsvps.data || []);
}

function renderPending(items){
  if (!items.length){ $("pendingList").innerHTML = '<p class="muted">Không có nội dung chờ duyệt 🎉</p>'; return; }
  $("pendingList").innerHTML = items.map(item => {
    const src = item.file_url || "";
    const media = item.file_type === "video" ? `<video controls preload="metadata" src="${escapeAttr(src)}"></video>` : `<img loading="lazy" src="${escapeAttr(src)}" alt="">`;
    return `<article class="media-card">${media}<div class="media-info"><strong>${escapeHtml(item.guest_name || "Khách mời")}</strong><div class="message">${escapeHtml(item.message || "")}</div><div class="actions"><button class="approve" onclick="setStatus('${item.id}','approved')">DUYỆT</button><button class="reject" onclick="setStatus('${item.id}','rejected')">TỪ CHỐI</button></div></div></article>`;
  }).join("");
}

window.setStatus = async (id,status) => {
  const { error } = await sb.from("media").update({status}).eq("id",id);
  if (error) { alert(error.message); return; }
  loadDashboard();
};

function renderRsvps(items){
  $("rsvpList").innerHTML = items.length ? items.map(x => `<tr><td>${formatDate(x.created_at)}</td><td>${escapeHtml(x.name)}</td><td>${x.attending ? "Có ❤️" : "Không"}</td><td>${x.guests}</td><td>${escapeHtml(x.message || "")}</td></tr>`).join("") : '<tr><td colspan="5" class="muted">Chưa có RSVP.</td></tr>';
}
function formatDate(v){try{return new Date(v).toLocaleString("vi-VN")}catch{return v}}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(v){return escapeHtml(v)}
