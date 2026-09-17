
const CONFIG = window.WEDDING_CONFIG || {};
const supabaseClient = window.supabase?.createClient(
  CONFIG.supabase?.url,
  CONFIG.supabase?.publishableKey
);

const weddingTarget = new Date(CONFIG.weddingDate || "2027-01-03T07:00:00+07:00").getTime();

function $(selector, root=document){ return root.querySelector(selector); }
function $$(selector, root=document){ return [...root.querySelectorAll(selector)]; }

function showToast(text){
  const toast = $("#toast");
  if(!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=>toast.classList.remove("show"), 3600);
}

/* Reveal */
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    }
  });
},{threshold:.12});
$$(".reveal").forEach(el=>revealObserver.observe(el));

/* Countdown */
function updateCountdown(){
  const diff = weddingTarget - Date.now();
  const ids = ["days","hours","minutes","seconds"];
  const section = $("#countdown-section");
  const panelTitle = $(".countdown-panel h2");
  const panelCopy = $(".countdown-panel__copy");

  if(diff <= 0){
    ids.forEach(id=>{ const el=$("#"+id); if(el) el.textContent="00"; });
    section?.classList.add("v5-married");
    if(panelTitle) panelTitle.textContent = "Chúng tôi đã cưới.";
    if(panelCopy) panelCopy.textContent = "Cảm ơn bạn đã hiện diện và chúc phúc cho hành trình của chúng tôi. ❤️";

    const mini = $(".mini-countdown");
    if(mini){
      mini.classList.add("is-married");
      mini.innerHTML = '<span class="mini-countdown__married">CHÚNG TÔI ĐÃ CƯỚI ❤️</span>';
    }
    return;
  }

  section?.classList.remove("v5-married");
  const values = [
    Math.floor(diff/86400000),
    Math.floor(diff/3600000)%24,
    Math.floor(diff/60000)%60,
    Math.floor(diff/1000)%60
  ];
  ids.forEach((id,i)=>{
    const el=$("#"+id);
    if(el) el.textContent=String(values[i]).padStart(i===0?3:2,"0");
  });
}
updateCountdown();
setInterval(updateCountdown,1000);

/* Mini countdown độc lập — không di chuyển section gốc, nên không tạo khoảng trống khó chịu */
(()=>{
  const section = $("#countdown-section");
  if(!section) return;

  const mini = document.createElement("div");
  mini.className = "mini-countdown";
  mini.setAttribute("aria-label", "Đếm ngược đến ngày cưới");
  mini.innerHTML = `
    <span class="mini-countdown__label">CÒN</span>
    <div><strong id="miniDays">--</strong><small>NGÀY</small></div>
    <div><strong id="miniHours">--</strong><small>GIỜ</small></div>
    <div><strong id="miniMinutes">--</strong><small>PHÚT</small></div>
    <div><strong id="miniSeconds">--</strong><small>GIÂY</small></div>
  `;
  document.body.appendChild(mini);

  function syncMini(){
    if(Date.now() >= weddingTarget){
      mini.classList.add("is-married");
      mini.innerHTML = '<span class="mini-countdown__married">CHÚNG TÔI ĐÃ CƯỚI ❤️</span>';
      return;
    }
    const map = [
      ["days","miniDays"],
      ["hours","miniHours"],
      ["minutes","miniMinutes"],
      ["seconds","miniSeconds"]
    ];
    map.forEach(([from,to])=>{
      const src = $("#"+from);
      const dst = $("#"+to);
      if(src && dst) dst.textContent = src.textContent;
    });
  }

  const miniTimer = setInterval(syncMini, 1000);
  syncMini();

  const updateVisibility = ()=>{
    const rect = section.getBoundingClientRect();
    const shouldShow = rect.bottom < 80;
    mini.classList.toggle("show", shouldShow);
  };

  addEventListener("scroll", updateVisibility, {passive:true});
  addEventListener("resize", updateVisibility);
  updateVisibility();

  window.addEventListener("beforeunload", ()=>clearInterval(miniTimer));
})();

/* Night-before: fully hidden unless explicitly enabled */
const nightBefore = $(".optional-section");
if(nightBefore){
  const enabled = CONFIG.theNightBefore === true;
  nightBefore.hidden = !enabled;
  nightBefore.setAttribute("aria-hidden", String(!enabled));
}

/* Supabase approved media */
let approvedMedia = [];
async function loadApprovedMedia(){
  if(!supabaseClient) return;
  const {data,error}=await supabaseClient
    .from("media")
    .select("id,file_url,file_type,guest_name,message,source,status,caption,featured,created_at")
    .eq("status","approved")
    .order("featured",{ascending:false})
    .order("created_at",{ascending:false})
    .limit(80);
  if(error){ console.warn("Approved media:",error); return; }
  approvedMedia = data || [];
  renderHeroPhoto();
  renderStoryPhotos();
  renderGallery("all");
}

function createMediaNode(item){
  const el = item.file_type === "video" ? document.createElement("video") : document.createElement("img");
  el.src = item.file_url;
  if(el.tagName==="VIDEO"){
    el.muted=true; el.loop=true; el.playsInline=true; el.controls=true;
  }else{
    el.loading="lazy";
    el.alt=item.caption || item.guest_name || "Kỷ niệm ngày cưới";
  }
  return el;
}

function renderHeroPhoto(){
  const heroImg=$("#heroPhoto");
  const placeholder=$("#heroPlaceholder");
  if(!heroImg) return;

  const approved = approvedMedia.find(m=>m.featured && m.file_type==="image" && m.source==="couple")
    || approvedMedia.find(m=>m.file_type==="image" && m.source==="couple");

  function showHero(src){
    heroImg.src = src;
    heroImg.hidden = false;
    if(placeholder) placeholder.hidden = true;
  }

  if(approved?.file_url){
    showHero(approved.file_url);
    return;
  }

  /* Optional local fallback:
     upload a file named hero-wedding.jpg beside index.html.
     If it doesn't exist, the elegant placeholder remains. */
  const tester = new Image();
  tester.onload = ()=>showHero("hero-wedding.jpg");
  tester.onerror = ()=>{
    heroImg.hidden = true;
    if(placeholder) placeholder.hidden = false;
  };
  tester.src = "hero-wedding.jpg?v=1";
}

function renderStoryPhotos(){
  const coupleImages = approvedMedia.filter(m=>m.source==="couple" && m.file_type==="image").slice(0,4);
  $$(".approved-media-slot").forEach((slot,i)=>{
    if(!coupleImages[i]) return;
    slot.innerHTML="";
    slot.appendChild(createMediaNode(coupleImages[i]));
  });
}

function renderGallery(filter="all"){
  const gallery=$("#approvedGallery");
  if(!gallery) return;
  let items=approvedMedia;
  if(filter==="couple") items=items.filter(m=>m.source==="couple");
  if(filter==="guest") items=items.filter(m=>m.source==="guest");
  gallery.innerHTML="";
  if(!items.length){
    gallery.innerHTML='<div class="gallery-empty">Chưa có ảnh/video được duyệt cho mục này.</div>';
    return;
  }
  items.slice(0,30).forEach(item=>{
    const card=document.createElement("article");
    card.className="gallery-item";
    card.dataset.source=item.source || "";
    card.appendChild(createMediaNode(item));
    const meta=document.createElement("div");
    meta.className="gallery-item__meta";
    meta.textContent=item.caption || item.message || (item.source==="guest" ? `Khoảnh khắc khách mời${item.guest_name ? " · "+item.guest_name : ""}` : "Bảo Điền & Hải Yến");
    card.appendChild(meta);
    gallery.appendChild(card);
  });
}

$$(".album-filters button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    $$(".album-filters button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderGallery(btn.dataset.filter || "all");
  });
});

/* Guest upload */
const uploadButton=$("#uploadPreview");
const uploadPanel=$("#uploadPanel");
const mediaFiles=$("#mediaFiles");
const uploadPreviewGrid=$("#uploadPreviewGrid");

uploadButton?.addEventListener("click",()=>{
  uploadPanel.hidden=!uploadPanel.hidden;
  if(!uploadPanel.hidden) uploadPanel.scrollIntoView({behavior:"smooth",block:"center"});
});

mediaFiles?.addEventListener("change",()=>{
  uploadPreviewGrid.innerHTML="";
  [...mediaFiles.files].slice(0,12).forEach(file=>{
    const url=URL.createObjectURL(file);
    const el=file.type.startsWith("video/")?document.createElement("video"):document.createElement("img");
    el.src=url;
    if(el.tagName==="VIDEO"){el.muted=true;el.controls=true;}
    uploadPreviewGrid.appendChild(el);
  });
});

$("#uploadForm")?.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!supabaseClient){showToast("Chưa kết nối được Supabase.");return;}
  const files=[...mediaFiles.files].slice(0,12);
  if(!files.length) return;
  const name=$("#guestName").value.trim();
  const message=$("#guestMessage").value.trim();
  const btn=event.currentTarget.querySelector("button[type=submit]");
  btn.disabled=true; btn.textContent="ĐANG TẢI LÊN…";
  let uploaded=0;
  try{
    for(const file of files){
      const isVideo=file.type.startsWith("video/");
      const bucket=isVideo?"wedding-videos":"wedding-photos";
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-").slice(-80);
      const path=`guest/${crypto.randomUUID()}-${safeName}`;
      const {error:storageError}=await supabaseClient.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
      if(storageError) throw storageError;
      const {data:publicData}=supabaseClient.storage.from(bucket).getPublicUrl(path);
      const {error:dbError}=await supabaseClient.from("media").insert({
        file_url:publicData.publicUrl,
        file_path:path,
        file_type:isVideo?"video":"image",
        guest_name:name,
        message,
        source:"guest",
        status:"pending"
      });
      if(dbError) throw dbError;
      uploaded++;
    }
    showToast(`${uploaded} file đã gửi thành công. Nội dung đang chờ duyệt ❤️`);
    event.currentTarget.reset();
    uploadPreviewGrid.innerHTML="";
    uploadPanel.hidden=true;
  }catch(error){
    console.error(error);
    showToast("Upload chưa thành công. Vui lòng thử lại.");
  }finally{
    btn.disabled=false; btn.textContent="GỬI VỀ ALBUM";
  }
});

/* RSVP */
$("#rsvpForm")?.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!supabaseClient){showToast("Chưa kết nối được Supabase.");return;}
  const form=event.currentTarget;
  const fd=new FormData(form);
  const attending=fd.get("attending")==="yes";
  const payload={
    name:String(fd.get("name")||"").trim(),
    attending,
    guests:Number(fd.get("guests")||1),
    message:String(fd.get("message")||"").trim()
  };
  const btn=form.querySelector("button[type=submit]");
  btn.disabled=true; btn.textContent="ĐANG GỬI…";
  const {error}=await supabaseClient.from("rsvps").insert(payload);
  btn.disabled=false; btn.textContent="GỬI XÁC NHẬN";
  if(error){console.error(error);showToast("Có lỗi khi gửi RSVP. Bạn thử lại nhé.");return;}
  showToast("Cảm ơn bạn! RSVP đã được gửi thành công ❤️");
  form.reset();
});

/* Opening bridge */
window.addEventListener("wedding:opening-complete",()=>{
  document.body.classList.add("invitation-opened");
  document.documentElement.classList.add("invitation-opened");
});


/* Optional background images for section transitions.
   If you upload these files beside index.html, they will appear automatically:
   story-bg.jpg, journey-bg.jpg, album-bg.jpg, locations-bg.jpg, rsvp-bg.jpg */
function initOptionalSectionBackgrounds(){
  $$(".has-optional-bg[data-bg]").forEach(section=>{
    const file = section.dataset.bg;
    if(!file) return;
    const test = new Image();
    test.onload = ()=>{
      section.style.setProperty("--section-bg-image", `url("${file}?v=1")`);
      section.classList.add("has-bg");
    };
    test.onerror = ()=>{};
    test.src = `${file}?v=1`;
  });
}

/* Hide empty family rows.
   If a field is blank, "-" , "ẩn" or "cập nhật sau", it will be hidden automatically. */
function initFamilyCards(){
  const hideValues = ["", "-", "ẩn", "an", "hide", "cập nhật sau", "cap nhat sau"];
  $$(".family-card").forEach(card=>{
    const rows = $$("dl div", card);
    let visible = 0;
    rows.forEach(row=>{
      const dd = $("dd", row);
      const text = (dd?.textContent || "").trim().toLowerCase();
      if(hideValues.includes(text)){
        row.hidden = true;
      }else{
        visible += 1;
      }
    });
    const detail = $(".family-card__details", card);
    const empty = $(".family-card__empty", card);
    if(detail) detail.hidden = visible === 0;
    if(empty) empty.hidden = visible > 0;
  });
}

initOptionalSectionBackgrounds();
initFamilyCards();

renderHeroPhoto();
loadApprovedMedia();


/* =========================================================
   V11 — AUDIO FLOW + SCHEDULE VISIBILITY
   ========================================================= */

const audioCfg = CONFIG.audio || {};
const scheduleCfg = CONFIG.schedule || {};

function applyScheduleVisibility(){
  const events = scheduleCfg.events || {};

  document.querySelectorAll(".ceremony-card[data-event]").forEach(card=>{
    const key = card.dataset.event;
    const cfg = events[key];
    if(cfg && cfg.enabled === false){
      card.hidden = true;
    }
  });

  const timeline = document.querySelector(".day-timeline");
  if(!timeline) return;

  if(scheduleCfg.showTimeline !== true){
    timeline.hidden = true;
    return;
  }

  let visibleCount = 0;
  timeline.querySelectorAll(".day-timeline__line > [data-event]").forEach(item=>{
    const key = item.dataset.event;
    const cfg = events[key] || {};
    const time = String(cfg.time || "").trim();
    const shouldShow = cfg.enabled !== false && time !== "";

    item.hidden = !shouldShow;

    if(shouldShow){
      visibleCount++;
      const timeEl = item.querySelector("time");
      if(timeEl) timeEl.textContent = time;
    }
  });

  // Không có giờ thật thì ẩn cả timeline, tránh hiện "--:--".
  timeline.hidden = visibleCount === 0;
}

applyScheduleVisibility();


/* ---------------- AUDIO MANAGER ---------------- */

const openingAmbient = document.getElementById("openingAmbient");
const vowAudioEl = document.getElementById("vowAudio");
const playlistAudio = document.getElementById("playlistAudio");
const audioControl = document.getElementById("audioControl");
const audioToggle = document.getElementById("audioToggle");
const audioPanel = document.getElementById("audioPanel");
const audioVolume = document.getElementById("audioVolume");
const audioIcon = document.getElementById("audioIcon");
const vowCaption = document.getElementById("vowCaption");
const vowCaptionText = document.getElementById("vowCaptionText");

let masterVolume = Number(localStorage.getItem("weddingMasterVolume") || "0.65");
if(!Number.isFinite(masterVolume)) masterVolume = .65;
masterVolume = Math.min(1, Math.max(0, masterVolume));

let muted = localStorage.getItem("weddingMuted") === "1";
let ambientUnlocked = false;
let vowStarted = false;
let vowDoneResolve = null;
let vowDonePromise = null;
let playlistQueue = [];
let playlistPlayed = 0;
let playlistStarted = false;
let vowCaptionTimer = null;

if(audioVolume){
  audioVolume.value = String(Math.round(masterVolume * 100));
}

function effectiveVolume(base){
  return muted ? 0 : Math.min(1, Math.max(0, Number(base || 0) * masterVolume));
}

function syncAllVolumes(){
  if(openingAmbient) openingAmbient.volume = effectiveVolume(audioCfg.openingVolume ?? .16);
  if(vowAudioEl) vowAudioEl.volume = effectiveVolume(audioCfg.vowVolume ?? .86);
  if(playlistAudio) playlistAudio.volume = effectiveVolume(audioCfg.playlistVolume ?? .28);

  if(audioIcon){
    audioIcon.textContent = muted || masterVolume === 0 ? "×" : "♪";
  }
  audioControl?.classList.toggle("is-muted", muted || masterVolume === 0);
}

function fadeAudio(el, to, duration=700){
  if(!el) return Promise.resolve();

  const from = el.volume;
  const target = muted ? 0 : Math.min(1, Math.max(0, to));
  const started = performance.now();

  return new Promise(resolve=>{
    function tick(now){
      const p = Math.min(1, (now-started)/duration);
      el.volume = from + (target-from)*p;
      if(p < 1){
        requestAnimationFrame(tick);
      }else{
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

async function tryStartAmbient(){
  if(!audioCfg.enabled || !openingAmbient || !audioCfg.openingInstrumental) return false;

  if(!openingAmbient.src){
    openingAmbient.src = audioCfg.openingInstrumental;
    openingAmbient.loop = true;
  }

  syncAllVolumes();

  try{
    await openingAmbient.play();
    ambientUnlocked = true;
    audioControl?.classList.add("is-playing");
    return true;
  }catch(_err){
    audioControl?.classList.add("needs-interaction");
    return false;
  }
}

function firstInteractionUnlock(){
  if(!ambientUnlocked){
    tryStartAmbient();
  }
}
document.addEventListener("pointerdown", firstInteractionUnlock, {capture:true});
document.addEventListener("keydown", firstInteractionUnlock, {capture:true});

audioToggle?.addEventListener("click", event=>{
  event.preventDefault();
  event.stopPropagation();

  // click icon toggles the volume panel; double click/middle state isn't needed.
  audioControl?.classList.toggle("is-open");
  if(muted){
    muted = false;
    localStorage.setItem("weddingMuted","0");
    syncAllVolumes();
    tryStartAmbient();
  }
});

audioToggle?.addEventListener("contextmenu", event=>{
  event.preventDefault();
  muted = !muted;
  localStorage.setItem("weddingMuted", muted ? "1" : "0");
  syncAllVolumes();
});

audioVolume?.addEventListener("input", ()=>{
  masterVolume = Number(audioVolume.value) / 100;
  localStorage.setItem("weddingMasterVolume", String(masterVolume));
  if(masterVolume > 0 && muted){
    muted = false;
    localStorage.setItem("weddingMuted","0");
  }
  syncAllVolumes();
});

function setVowCaptionLine(index){
  const lines = Array.isArray(audioCfg.vowLines) ? audioCfg.vowLines : [];
  if(!vowCaption || !vowCaptionText || !lines.length) return;
  vowCaption.hidden = false;
  vowCaption.classList.add("show");
  vowCaptionText.textContent = lines[Math.min(lines.length-1, Math.max(0,index))];
}

function startCaptionSync(){
  const lines = Array.isArray(audioCfg.vowLines) ? audioCfg.vowLines : [];
  if(!lines.length || !vowAudioEl) return;

  clearInterval(vowCaptionTimer);
  setVowCaptionLine(0);

  vowCaptionTimer = setInterval(()=>{
    if(!Number.isFinite(vowAudioEl.duration) || vowAudioEl.duration <= 0) return;
    const ratio = vowAudioEl.currentTime / vowAudioEl.duration;
    const idx = Math.min(lines.length-1, Math.floor(ratio * lines.length));
    setVowCaptionLine(idx);
  }, 180);
}

function hideVowCaption(){
  clearInterval(vowCaptionTimer);
  vowCaptionTimer = null;
  if(vowCaption){
    vowCaption.classList.remove("show");
    setTimeout(()=>{ vowCaption.hidden = true; }, 400);
  }
}

function shuffle(items){
  const copy = [...items];
  for(let i=copy.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

function preparePlaylist(){
  const list = Array.isArray(audioCfg.playlist) ? audioCfg.playlist.filter(Boolean) : [];
  playlistQueue = shuffle(list);
  playlistPlayed = 0;
}

async function playNextPlaylistTrack(){
  if(!playlistAudio || !playlistQueue.length) return;
  const maxTracks = Math.max(0, Number(audioCfg.maxPlaylistTracks || 3));
  if(playlistPlayed >= maxTracks) return;

  const next = playlistQueue.shift();
  if(!next) return;

  playlistAudio.src = next;
  playlistAudio.volume = 0;
  playlistPlayed++;

  try{
    await playlistAudio.play();
    await fadeAudio(playlistAudio, effectiveVolume(audioCfg.playlistVolume ?? .28), 1000);
  }catch(_err){
    // Nếu thiếu 1 file, tự bỏ qua file đó và thử file kế tiếp.
    playNextPlaylistTrack();
  }
}

playlistAudio?.addEventListener("ended", ()=>{
  playNextPlaylistTrack();
});

async function startPlaylist(){
  if(playlistStarted) return;
  playlistStarted = true;
  preparePlaylist();
  playNextPlaylistTrack();
}

function finishVowFlow(){
  hideVowCaption();

  // Hòa từ instrumental sang playlist.
  Promise.all([
    fadeAudio(openingAmbient, 0, 850),
    startPlaylist()
  ]).finally(()=>{
    if(openingAmbient){
      setTimeout(()=>{
        openingAmbient.pause();
        openingAmbient.currentTime = 0;
      }, 900);
    }
  });

  vowDoneResolve?.();
  vowDoneResolve = null;
}

function startVow(){
  if(vowStarted) return vowDonePromise;
  vowStarted = true;

  vowDonePromise = new Promise(resolve=>{
    vowDoneResolve = resolve;
  });

  if(!audioCfg.enabled || !vowAudioEl || !audioCfg.vowAudio){
    setTimeout(finishVowFlow, 4100);
    return vowDonePromise;
  }

  // Nhạc nền lùi xuống phía sau lời hứa.
  fadeAudio(openingAmbient, effectiveVolume((audioCfg.openingVolume ?? .16) * .32), 500);

  vowAudioEl.src = audioCfg.vowAudio;
  vowAudioEl.volume = effectiveVolume(audioCfg.vowVolume ?? .86);

  const fallback = setTimeout(()=>{
    if(!vowAudioEl.duration || vowAudioEl.paused){
      finishVowFlow();
    }
  }, 4700);

  vowAudioEl.addEventListener("playing", ()=>{
    clearTimeout(fallback);
    startCaptionSync();
  }, {once:true});

  vowAudioEl.addEventListener("ended", finishVowFlow, {once:true});
  vowAudioEl.addEventListener("error", ()=>{
    clearTimeout(fallback);
    finishVowFlow();
  }, {once:true});

  vowAudioEl.play().catch(()=>{
    // Safari/mobile: click seal là user gesture nên thường play được.
    // Nếu vẫn bị chặn, không giữ khách ở màn Opening vô hạn.
    clearTimeout(fallback);
    setTimeout(finishVowFlow, 4100);
  });

  return vowDonePromise;
}

window.addEventListener("wedding:seal-opened", ()=>{
  startVow();
});

window.waitForWeddingVowThenFinish = function(finishOpening){
  if(!vowStarted){
    startVow();
  }
  Promise.resolve(vowDonePromise)
    .catch(()=>{})
    .finally(()=>setTimeout(finishOpening, 450));
};

// Sau khi vào bên trong: ambient không còn phát, playlist tiếp tục.
window.addEventListener("wedding:opening-complete", ()=>{
  audioControl?.classList.add("inside-site");
});

syncAllVolumes();
// Thử autoplay ngay khi mở link. Trên iOS/Chrome mobile có thể bị chặn;
// lần chạm đầu tiên sẽ tự mở khóa âm thanh.
tryStartAmbient();
