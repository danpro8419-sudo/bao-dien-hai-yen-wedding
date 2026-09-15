
const CONFIG = window.WEDDING_CONFIG || {};
const supabaseClient = window.supabase?.createClient(
  CONFIG.supabase?.url,
  CONFIG.supabase?.publishableKey
);

const weddingTarget = new Date(CONFIG.weddingDate || "2027-01-03T00:00:00+07:00").getTime();

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
  if(diff <= 0){
    ids.forEach(id=>{ const el=$("#"+id); if(el) el.textContent="00"; });
    $("#countdown-section")?.classList.add("v5-married");
    return;
  }
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
