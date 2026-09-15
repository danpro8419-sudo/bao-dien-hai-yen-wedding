const CONFIG = window.WEDDING_CONFIG || {};
const opening = document.getElementById("opening");
const site = document.getElementById("site");
const envelope = document.getElementById("envelope");
const openBtn = document.getElementById("openBtn");
const music = document.getElementById("music");
const musicToggle = document.getElementById("musicToggle");
const supabaseClient = window.supabase?.createClient(CONFIG.supabase.url, CONFIG.supabase.publishableKey);

function openInvitation(){
  envelope.classList.add("open");
  setTimeout(()=>{
    opening.classList.add("hide");
    site.classList.add("visible");
    site.setAttribute("aria-hidden","false");
    document.body.style.overflowY="auto";
    music.play().catch(()=>{});
    musicToggle.textContent="♫";
  },900);
}
openBtn.addEventListener("click",openInvitation);
envelope.addEventListener("click",openInvitation);
envelope.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")openInvitation()});
document.body.style.overflow="hidden";

musicToggle.addEventListener("click",()=>{
  if(music.paused){music.play().catch(()=>{});musicToggle.textContent="♫"}
  else{music.pause();musicToggle.textContent="♪"}
});

const target = new Date(CONFIG.weddingDate || "2027-01-03T17:30:00+07:00").getTime();
function countdown(){
  const diff=target-Date.now();
  if(diff<=0){
    document.getElementById("days").textContent="00";
    document.getElementById("hours").textContent="00";
    document.getElementById("minutes").textContent="00";
    document.getElementById("seconds").textContent="00";
    return;
  }
  const d=Math.floor(diff/86400000), h=Math.floor(diff/3600000)%24, m=Math.floor(diff/60000)%60, s=Math.floor(diff/1000)%60;
  document.getElementById("days").textContent=String(d).padStart(3,"0");
  document.getElementById("hours").textContent=String(h).padStart(2,"0");
  document.getElementById("minutes").textContent=String(m).padStart(2,"0");
  document.getElementById("seconds").textContent=String(s).padStart(2,"0");
}
countdown();setInterval(countdown,1000);

if(CONFIG.theNightBefore===true){
  const section=document.querySelector(".optional-section");
  section.hidden=false;section.dataset.enabled="true";
}

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("in")});
},{threshold:.12});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

function showToast(text){
  const t=document.getElementById("toast");t.textContent=text;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),3800);
}

// RSVP → Supabase
const rsvpForm=document.getElementById("rsvpForm");
rsvpForm.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!supabaseClient){showToast("Chưa kết nối được Supabase.");return;}
  const name=rsvpForm.querySelector("input").value.trim();
  const attending=rsvpForm.querySelector("select").value==="YES, I'LL BE THERE";
  const guests=Number(rsvpForm.querySelector("input[type=number]").value||1);
  const message=rsvpForm.querySelector("textarea").value.trim();
  const btn=rsvpForm.querySelector("button"); btn.disabled=true; btn.textContent="SENDING…";
  const {error}=await supabaseClient.from("rsvps").insert({name,attending,guests,message});
  btn.disabled=false; btn.textContent="CONFIRM ATTENDANCE";
  if(error){console.error(error);showToast("Có lỗi khi gửi RSVP. Bạn thử lại nhé.");return;}
  showToast("Cảm ơn bạn! RSVP đã được gửi thành công ❤️");
  rsvpForm.reset();
});

// Guest media upload → Storage + pending media record
const uploadButton=document.getElementById("uploadPreview");
const uploadPanel=document.getElementById("uploadPanel");
const mediaFiles=document.getElementById("mediaFiles");
const uploadPreviewGrid=document.getElementById("uploadPreviewGrid");

uploadButton.addEventListener("click",()=>{
  uploadPanel.hidden=!uploadPanel.hidden;
  if(!uploadPanel.hidden) uploadPanel.scrollIntoView({behavior:"smooth",block:"center"});
});

mediaFiles.addEventListener("change",()=>{
  uploadPreviewGrid.innerHTML="";
  [...mediaFiles.files].slice(0,12).forEach(file=>{
    const url=URL.createObjectURL(file);
    const el=file.type.startsWith("video/")?document.createElement("video"):document.createElement("img");
    el.src=url; el.muted=true; el.controls=file.type.startsWith("video/");
    uploadPreviewGrid.appendChild(el);
  });
});

document.getElementById("uploadForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!supabaseClient){showToast("Chưa kết nối được Supabase.");return;}
  const files=[...mediaFiles.files];
  if(!files.length)return;
  const name=document.getElementById("guestName").value.trim();
  const message=document.getElementById("guestMessage").value.trim();
  const btn=e.target.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="UPLOADING…";
  let uploaded=0;
  try{
    for(const file of files.slice(0,12)){
      const isVideo=file.type.startsWith("video/");
      const bucket=isVideo?"wedding-videos":"wedding-photos";
      const ext=(file.name.split(".").pop()||"bin").toLowerCase();
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-").slice(-80);
      const path=`guest/${crypto.randomUUID()}-${safeName}`;
      const {error:storageError}=await supabaseClient.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
      if(storageError)throw storageError;
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
      if(dbError)throw dbError;
      uploaded++;
    }
    showToast(`${uploaded} file đã gửi thành công. Hai bạn sẽ duyệt trước khi đăng ❤️`);
    e.target.reset(); uploadPreviewGrid.innerHTML="";
  }catch(error){
    console.error(error);
    showToast("Upload chưa thành công. Kiểm tra Storage Policy rồi thử lại.");
  }finally{
    btn.disabled=false; btn.textContent="SEND TO OUR ALBUM";
  }
});

/* ===== V5 STICKY COUNTDOWN ===== */
(()=>{const s=document.getElementById("countdown-section");if(!s)return;
const weddingDate=new Date(2027,0,3,0,0,0);if(new Date()>=weddingDate)s.classList.add("v5-married");
const marker=document.createElement("div");marker.setAttribute("aria-hidden","true");marker.style.cssText="height:1px;width:100%;pointer-events:none;";s.parentNode.insertBefore(marker,s);
let raf=0;const update=()=>{s.classList.toggle("v5-sticky-countdown",marker.getBoundingClientRect().top < -Math.max(s.offsetHeight,80));};
const req=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;update();});};
addEventListener("scroll",req,{passive:true});addEventListener("resize",req);update();})();


/* ===== V6 — MOBILE VIEWPORT SUPPORT ===== */
(() => {
  const setViewport = () => {
    document.documentElement.style.setProperty("--v6-vh", `${window.innerHeight * 0.01}px`);
  };
  setViewport();
  window.addEventListener("resize", setViewport, { passive: true });
  window.addEventListener("orientationchange", setViewport, { passive: true });
})();


/* ===== V7 — SEAL CLICK -> TEAR -> NAMES -> 3s -> ENTER ===== */
(() => {
  const seal = document.getElementById("v7InvitationSeal");
  const btn = document.getElementById("v7SealButton");
  if (!seal || !btn) return;

  let running = false;

  const findOriginalTrigger = () =>
    document.querySelector("#openInvitation, .open-invitation, .open-btn, [data-open-invitation]");

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (running) return;
    running = true;

    seal.classList.add("v7-tearing");

    window.setTimeout(() => {
      seal.classList.remove("v7-tearing");
      seal.classList.add("v7-revealed");

      // Pause on Bảo Điền & Hải Yến for exactly 3 seconds.
      window.setTimeout(() => {
        seal.style.transition = "opacity .7s ease";
        seal.style.opacity = "0";
        const original = findOriginalTrigger();
        if (original && original !== btn) {
          original.click();
        } else {
          // Fallback: reveal main content using common classes.
          document.body.classList.add("invitation-opened");
          const opening = document.querySelector(".opening, .hero, .invitation-opening");
          if (opening) opening.classList.add("opened");
        }
        window.setTimeout(() => { seal.style.display = "none"; }, 750);
      }, 3000);
    }, 850);
  }, true);
})();
