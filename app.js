import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where, orderBy, onSnapshot, getDocs, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");
let db=null, auth=null, storage=null;
if(configured){
  const app=initializeApp(firebaseConfig);
  auth=getAuth(app); db=getFirestore(app); storage=getStorage(app);
}

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={user:null,profile:null,role:"customer",view:"explore",authMode:"login",selectedRole:"customer",ads:[],activeChat:null,unsub:null,demo:false};
const FALLBACK_IMAGES=["market-candy.jpg","market-beauty.jpg","market-transport.jpg","market-salon.jpg","market-snacks.jpg","market-photography.jpg"];

function toast(msg,type="ok"){const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=msg;$("#toast-root").append(el);setTimeout(()=>el.remove(),3500)}
function fmtDate(v){if(!v)return "—"; const d=v.toDate?v.toDate():new Date(v); return isNaN(d)?"—":d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
function money(ad){const p=ad.price||0;return `${ad.currency||"USD"} ${Number(p).toFixed(2)}`}
function isActive(ad){return ad.status==="active" && ad.expiresAt && new Date(ad.expiresAt.toDate?ad.expiresAt.toDate():ad.expiresAt)>new Date()}
function imgFor(ad,i=0){return ad.imageUrl||`./assets/${FALLBACK_IMAGES[i%FALLBACK_IMAGES.length]}`}

function openAuth(mode="login"){state.authMode=mode;$("#landing").classList.add("hidden");$("#auth-screen").classList.remove("hidden");renderAuth()}
function closeAuth(){$("#auth-screen").classList.add("hidden");$("#landing").classList.remove("hidden")}
function renderAuth(){
  $("#auth-title").textContent=state.authMode==="login"?"Welcome back":"Create your Ivy House account";
  $("#auth-subtitle").textContent=state.authMode==="login"?"Sign in to access your dashboard.":"Choose how you will use the marketplace.";
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.authMode===state.authMode));
  $("#signup-fields").classList.toggle("hidden",state.authMode!=="signup");
  $("#auth-role-picker").classList.toggle("hidden",state.authMode!=="signup");
  $("#auth-submit").textContent=state.authMode==="login"?"Sign in":"Create account";
  $$(".role-card").forEach(b=>b.classList.toggle("active",b.dataset.role===state.selectedRole));
}
$$(".tab").forEach(b=>b.onclick=()=>{state.authMode=b.dataset.authMode;renderAuth()});
$$(".role-card").forEach(b=>b.onclick=()=>{state.selectedRole=b.dataset.role;renderAuth()});
$("#open-login").onclick=()=>openAuth("login"); $("#open-signup").onclick=()=>openAuth("signup"); $("#close-auth").onclick=closeAuth;
$("#open-explore").onclick=()=>openAuth("login");

$("#auth-form").onsubmit=async e=>{
 e.preventDefault(); const email=$("#auth-email").value.trim(), password=$("#auth-password").value;
 try{
  if(!configured){demoLogin(state.selectedRole);return}
  if(state.authMode==="signup"){
    const cred=await createUserWithEmailAndPassword(auth,email,password);
    const username=$("#auth-username").value.trim()||email.split("@")[0];
    const fullName=$("#auth-fullname").value.trim()||username;
    await updateProfile(cred.user,{displayName:fullName});
    await setDoc(doc(db,"users",cred.user.uid),{uid:cred.user.uid,email,username,fullName,role:state.selectedRole,createdAt:serverTimestamp(),bio:"",phone:"",location:"",photoURL:""});
    toast("Account created. Welcome to Ivy House!");
  }else await signInWithEmailAndPassword(auth,email,password);
  closeAuth();
 }catch(err){toast(friendlyError(err),"err")}
};
$("#demo-login").onclick=()=>{demoLogin(state.selectedRole);closeAuth()};
function demoLogin(role){
 state.demo=true; state.user={uid:"demo-"+role,email:role+"@demo.ivyhouse.local",displayName:role==="advertiser"?"Demo Advertiser":"Demo Customer"};state.role=role;
 state.profile={uid:state.user.uid,email:state.user.email,username:role==="advertiser"?"DemoAdvertiser":"DemoCustomer",fullName:state.user.displayName,role,bio:"A student-run business on Ivy House Marketing.",phone:"0780000000",location:"Boarding House",createdAt:new Date()};
 state.ads=demoAds(); state.view=role==="advertiser"?"dashboard":"explore"; showApp();
}
function demoAds(){return[
 {id:"d1",title:"Sweet Treats & Snacks",category:"Goods",description:"Fresh snacks, sweets and treats available for quick pickup.",location:"Room 12",contact:"0780000001",price:2.5,currency:"USD",advertiserName:"Demo Advertiser",businessName:"Sweet Treats",imageUrl:"./assets/market-candy.jpg",status:"active",expiresAt:new Date(Date.now()+86400000*3)},
 {id:"d2",title:"Beauty & Makeup",category:"Goods",description:"Beauty products and cosmetics for everyday looks.",location:"Room 7",contact:"0780000002",price:5,currency:"USD",advertiserName:"Beauty Hub",businessName:"Beauty Hub",imageUrl:"./assets/market-beauty.jpg",status:"active",expiresAt:new Date(Date.now()+86400000*3)},
 {id:"d3",title:"Student Transport",category:"Services",description:"Reliable rides and transport around the local area.",location:"Main Gate",contact:"0780000003",price:3,currency:"USD",advertiserName:"Ivy Rides",businessName:"Ivy Rides",imageUrl:"./assets/market-transport.jpg",status:"active",expiresAt:new Date(Date.now()+86400000*3)},
 {id:"d4",title:"Hair Styling",category:"Services",description:"Braiding, styling and salon services by appointment.",location:"Room 21",contact:"0780000004",price:4,currency:"USD",advertiserName:"Ivy Beauty",businessName:"Ivy Beauty",imageUrl:"./assets/market-salon.jpg",status:"active",expiresAt:new Date(Date.now()+86400000*3)},
 {id:"d5",title:"Photography",category:"Services",description:"Portraits, events and product photography.",location:"Campus",contact:"0780000005",price:10,currency:"USD",advertiserName:"Ivy Lens",businessName:"Ivy Lens",imageUrl:"./assets/market-photography.jpg",status:"active",expiresAt:new Date(Date.now()+86400000*3)}
]}

function friendlyError(e){return e?.code?.replace("auth/","").replaceAll("-"," ")||e.message||"Something went wrong."}
function showApp(){ $("#landing").classList.add("hidden");$("#auth-screen").classList.add("hidden");$("#app-screen").classList.remove("hidden"); renderShell(); loadAds(); }
function renderShell(){
 $("#user-mini").innerHTML=`<strong>${esc(state.profile?.fullName||state.user?.displayName||"User")}</strong><span>@${esc(state.profile?.username||"user")} · ${esc(state.role)}</span>`;
 $("#header-avatar").textContent=(state.profile?.fullName||"I").charAt(0).toUpperCase();
 const nav=state.role==="advertiser"
 ? [["dashboard","⌂","Dashboard"],["profile","◉","Profile"],["add-advert","＋","Add advert"],["subscription","◆","0.05 / 3 days"],["messages","💬","Messages"]]
 : [["explore","⌕","Explore"],["profile","◉","Profile"],["messages","💬","Messages"],["cart","🛒","Cart"]];
 $("#side-nav").innerHTML=nav.map(x=>`<button class="nav-item ${state.view===x[0]?"active":""}" data-view="${x[0]}">${x[1]} <span>${x[2]}</span></button>`).join("");
 $$(".nav-item").forEach(b=>b.onclick=()=>navigate(b.dataset.view));
 $("#page-title").textContent=titleFor(state.view); $("#page-kicker").textContent=state.role==="advertiser"?"ADVERTISER DASHBOARD":"CUSTOMER DASHBOARD";
}
function titleFor(v){return {dashboard:"Business overview",profile:"My profile","add-advert":"Create an advert",subscription:"Advert subscription",messages:"Messages",explore:"Explore adverts",cart:"My cart",help:"Help & support"}[v]||"Ivy House Marketing"}
function navigate(v){state.view=v;renderShell();renderView();$("#side-nav").closest(".sidebar")?.classList.remove("open")}
$("#logout-btn").onclick=async()=>{if(auth)await signOut(auth);state.user=null;state.profile=null;state.demo=false;$("#app-screen").classList.add("hidden");$("#landing").classList.remove("hidden")};
$("#mobile-menu").onclick=()=>$(".sidebar").classList.toggle("open");$("#messages-shortcut").onclick=()=>navigate("messages");$("#header-avatar").onclick=()=>navigate("profile");

async function loadProfile(){
 if(state.demo)return;
 const snap=await getDoc(doc(db,"users",state.user.uid));
 state.profile=snap.exists()?snap.data():{uid:state.user.uid,email:state.user.email,username:state.user.email.split("@")[0],fullName:state.user.displayName||"User",role:"customer"};
 state.role=state.profile.role||"customer";
}
async function loadAds(){
 if(state.demo){renderView();return}
 try{
  const snap=await getDocs(query(collection(db,"adverts"),orderBy("createdAt","desc")));
  state.ads=snap.docs.map(d=>({id:d.id,...d.data()})); renderView();
 }catch(e){toast("Could not load adverts yet. Check Firestore setup.","err");state.ads=[];renderView()}
}
function renderView(){
 const root=$("#view-root"); if(!root)return;
 if(state.view==="explore") root.innerHTML=exploreHTML();
 else if(state.view==="dashboard") root.innerHTML=dashboardHTML();
 else if(state.view==="profile") root.innerHTML=profileHTML();
 else if(state.view==="add-advert") root.innerHTML=addAdvertHTML();
 else if(state.view==="subscription") root.innerHTML=subscriptionHTML();
 else if(state.view==="messages") root.innerHTML=messagesHTML();
 else if(state.view==="cart") root.innerHTML=cartHTML();
 else root.innerHTML=helpHTML();
 bindView();
}
function exploreHTML(){
 const active=state.ads.filter(a=>isActive(a)||state.demo); return `<div class="card"><div class="section-title"><h2>Find something useful</h2><span class="badge badge-cyan">${active.length} adverts</span></div><div class="search-row"><input id="search-ads" placeholder="Search advertiser, business, product or service..."><button class="btn btn-maroon" id="search-btn">Search</button></div><div class="chips"><button class="chip active" data-cat="All">All</button><button class="chip" data-cat="Goods">Goods</button><button class="chip" data-cat="Services">Services</button></div><div id="ad-results" class="ad-grid">${adCards(active)}</div></div>`;
}
function adCards(ads){
 if(!ads.length)return `<div class="empty" style="grid-column:1/-1"><strong>No active adverts yet.</strong>Advertisers can unlock their adverts after subscribing.</div>`;
 return ads.map((a,i)=>{const active=isActive(a)||state.demo;return `<article class="ad-card"><div class="ad-image" style="background-image:url('${esc(imgFor(a,i))}')">${!active?'<div class="ad-lock">🔒 ADVERT LOCKED</div>':''}</div><div class="ad-body"><span class="badge ${a.category==="Services"?"badge-cyan":"badge-gold"}">${esc(a.category||"Goods")}</span><h3>${esc(a.title||a.businessName||"Advert")}</h3><div class="ad-meta"><span>📍 ${esc(a.location||"Location on request")}</span><span>👤 ${esc(a.advertiserName||"Advertiser")}</span></div><p class="muted" style="font-size:12px;line-height:1.5">${esc(a.description||"")}</p><div class="price">${money(a)}</div><div class="ad-actions">${active?`<button class="btn btn-maroon view-ad" data-id="${a.id}">View</button><button class="btn btn-cyan message-ad" data-id="${a.id}">Message</button>`:`<button class="btn btn-outline" disabled>Locked</button>`}</div></div></article>`}).join("");
}
function dashboardHTML(){
 const mine=state.ads.filter(a=>a.advertiserId===state.user?.uid||state.demo&&a.advertiserName==="Demo Advertiser");const active=mine.filter(a=>isActive(a)||state.demo).length;
 return `<div class="page-grid"><div class="span-12 stat-row"><div class="stat"><b>${mine.length}</b><span>Total adverts</span></div><div class="stat"><b>${active}</b><span>Active adverts</span></div><div class="stat"><b>${mine.filter(a=>!isActive(a)&&!state.demo).length}</b><span>Locked adverts</span></div></div><div class="span-8 card"><div class="section-title"><h2>Your adverts</h2><button class="btn btn-maroon" id="go-add">+ Add advert</button></div>${mine.length?`<div class="ad-grid">${adCards(mine)}</div>`:`<div class="empty"><strong>Your business starts here.</strong>Create your first advert and make it visible to customers.</div>`}</div><div class="span-4 card subscription-box"><span class="eyebrow">3-DAY VISIBILITY</span><h2>Keep your adverts live.</h2><p>Pay just <b>$0.05 USD</b> to unlock your advertising visibility for three days.</p><div class="payment-number">EcoCash 263 785 932 494</div><br><button class="btn btn-gold" id="go-sub">Manage subscription</button></div></div>`;
}
function profileHTML(){
 const p=state.profile||{};return `<div class="page-grid"><div class="span-8 card"><div class="profile-head"><div class="profile-photo" style="display:grid;place-items:center;font-size:32px;color:#fff;background:var(--maroon)">${(p.fullName||"I")[0]}</div><div><h2>${esc(p.fullName||"Your name")}</h2><div class="muted">@${esc(p.username||"username")} · ${esc(p.role||state.role)}</div><div class="badge badge-gold" style="margin-top:7px">${state.role==="advertiser"?"BUSINESS ADVERTISER":"CUSTOMER"}</div></div></div><div class="divider"></div><div class="info-list"><div class="info-item"><span>Email</span><b>${esc(p.email||state.user?.email||"")}</b></div><div class="info-item"><span>Phone</span><b>${esc(p.phone||"Not added")}</b></div><div class="info-item"><span>Location</span><b>${esc(p.location||"Not added")}</b></div><div class="info-item"><span>Business</span><b>${esc(p.businessName||"Not added")}</b></div></div><div class="divider"></div><h3>About</h3><p class="muted">${esc(p.bio||"Add a short description so customers quickly understand what you offer.")}</p><button class="btn btn-outline" id="edit-profile">Edit profile</button></div><div class="span-4 card"><h3>${state.role==="advertiser"?"Business progress":"Marketplace activity"}</h3><p class="muted">${state.role==="advertiser"?"Build a complete profile, publish adverts and collect reviews.":"Explore businesses, save products and start conversations."}</p><div class="progress"><span style="width:${profileProgress(p)}%"></span></div><p class="tiny">${profileProgress(p)}% profile complete</p></div></div>`;
}
function profileProgress(p){let fields=["username","fullName","phone","location","bio"];return Math.round(fields.filter(x=>p[x]).length/fields.length*100)}
function addAdvertHTML(){
 return `<div class="card"><div class="section-title"><div><h2>Create a professional advert</h2><p class="muted">Show customers exactly what you sell or the service you provide.</p></div><span class="badge badge-gold">$0.05 / 3 days</span></div><form id="advert-form"><div class="form-grid"><label>Advert title<input id="ad-title" required placeholder="e.g. Fresh snacks & sweets"></label><label>Category<select id="ad-category"><option>Goods</option><option>Services</option></select></label><label class="form-full">Description<textarea id="ad-description" required placeholder="Describe the product/service, what makes it useful and how customers can order."></textarea></label><label>Location / room / live location<input id="ad-location" placeholder="e.g. Room 12 or Main Gate"></label><label>Contact / WhatsApp<input id="ad-contact" placeholder="e.g. 078..."></label><label>Price<input id="ad-price" type="number" step="0.01" min="0" required placeholder="0.00"></label><label>Currency<select id="ad-currency"><option>USD</option><option>ZIG</option></select></label><label>Delivery fee<input id="ad-delivery" type="number" step="0.01" min="0" value="0"></label><label>Delivery currency<select id="ad-delivery-currency"><option>USD</option><option>ZIG</option></select></label><label>Product/service photo<input id="ad-image" type="file" accept="image/*" required></label><label>WhatsApp QR (optional)<input id="ad-qr" type="file" accept="image/*"></label><label class="form-full"><input id="ad-free-delivery" type="checkbox"> <span>Offer free delivery / pickup at no extra charge</span></label></div><div class="payment-card"><b>Before an advert becomes visible</b><p class="muted">Send <strong>$0.05 USD</strong> via EcoCash to <strong>263 785 932 494</strong>. Enter the EcoCash reference below. Your advert will remain pending until payment is confirmed.</p><label>EcoCash payment reference<input id="ad-payment-ref" required placeholder="Enter EcoCash reference"></label></div><button class="btn btn-maroon btn-full" type="submit">Submit advert & payment request</button></form></div>`;
}
function subscriptionHTML(){
 return `<div class="page-grid"><div class="span-8 card subscription-box"><span class="eyebrow">ADVERT VISIBILITY</span><h2>$0.05 USD every 3 days</h2><p>One simple subscription keeps your adverts visible to customers for another three days. When the time expires, the advert automatically becomes locked until the next approved payment.</p><div class="payment-number">EcoCash: 263 785 932 494</div><div class="payment-card" style="color:#222"><b>How to renew</b><ol class="muted"><li>Send $0.05 USD through EcoCash.</li><li>Enter the payment reference below.</li><li>Submit your renewal request.</li><li>After verification, your advert visibility is extended for 3 days.</li></ol></div><button class="btn btn-gold" id="renew-btn">Submit renewal</button></div><div class="span-4 card"><h3>Advert status</h3>${state.ads.filter(a=>a.advertiserId===state.user?.uid).map(a=>`<div class="info-item"><span>${esc(a.title)}</span><b>${isActive(a)?"LIVE":"LOCKED"}</b></div>`).join("")||'<p class="muted">No adverts yet.</p>'}</div></div>`;
}
function messagesHTML(){
 return `<div class="card" style="padding:0;overflow:hidden"><div class="chat-layout"><div class="chat-list" id="chat-list"><div class="chat-contact"><b>Messages</b><span>Talk directly with customers or advertisers.</span></div></div><div class="chat-window"><div class="chat-head"><b id="chat-title">Select a conversation</b><div class="muted" id="chat-sub">Your conversations will appear here.</div></div><div class="messages" id="messages"><div class="empty">💬<strong>Private marketplace chat</strong>Select a conversation to start messaging.</div></div><form class="chat-input" id="chat-form"><input id="chat-text" placeholder="Type a message..." disabled><button class="btn btn-maroon" disabled>Send</button></form></div></div></div>`;
}
function cartHTML(){const cart=JSON.parse(localStorage.getItem("ivy_cart")||"[]");return `<div class="card"><div class="section-title"><h2>Your cart</h2><span class="badge badge-cyan">${cart.length} items</span></div>${cart.length?cart.map((x,i)=>`<div class="info-item"><span>${esc(x.title)} × ${x.qty}</span><b>${money(x)}</b></div>`).join("")+'<br><button class="btn btn-maroon" id="checkout">Message advertiser to arrange payment & delivery</button>':`<div class="empty"><strong>Your cart is empty.</strong>Explore adverts and add products you want to order.</div>`}</div>`}
function helpHTML(){return `<div class="page-grid"><div class="span-8 card"><h2>Help & support</h2><div class="info-list"><div><h3>How does advertising work?</h3><p class="muted">Create your advertiser account, publish your advert and submit the $0.05 EcoCash payment reference. After verification, the advert is visible for three days.</p></div><div><h3>What happens after 3 days?</h3><p class="muted">The advert locks automatically. Renew with another $0.05 payment to make it visible again.</p></div><div><h3>How do customers pay?</h3><p class="muted">Customers can communicate with the advertiser and arrange physical payment or EcoCash directly with the seller.</p></div><div><h3>Delivery</h3><p class="muted">Advertisers set their delivery fee or can offer free delivery/pickup.</p></div></div></div><div class="span-4 card"><h3>Need assistance?</h3><p class="muted">Contact the Ivy House Marketing administrator with your username, advert title and payment reference.</p><button class="btn btn-cyan" id="help-message">Open messages</button></div></div>`}

function bindView(){
 $("#go-add")?.addEventListener("click",()=>navigate("add-advert"));$("#go-sub")?.addEventListener("click",()=>navigate("subscription"));
 $("#search-btn")?.addEventListener("click",filterAds);$("#search-ads")?.addEventListener("input",filterAds);
 $$(".chip").forEach(c=>c.onclick=()=>{$$(".chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");filterAds()});
 $$(".view-ad").forEach(b=>b.onclick=()=>showAd(b.dataset.id));$$(".message-ad").forEach(b=>b.onclick=()=>openChatForAd(b.dataset.id));
 $("#advert-form")?.addEventListener("submit",submitAdvert);$("#renew-btn")?.addEventListener("click",renew);
 $("#edit-profile")?.addEventListener("click",editProfile);$("#help-message")?.addEventListener("click",()=>navigate("messages"));
 $("#checkout")?.addEventListener("click",()=>navigate("messages"));
}
function filterAds(){const q=($("#search-ads")?.value||"").toLowerCase();const cat=$(".chip.active")?.dataset.cat||"All";const ads=state.ads.filter(a=>(isActive(a)||state.demo)&& (cat==="All"||a.category===cat) && [a.title,a.description,a.advertiserName,a.businessName,a.category].join(" ").toLowerCase().includes(q));$("#ad-results").innerHTML=adCards(ads);bindView()}
function showAd(id){
 const a=state.ads.find(x=>x.id===id);if(!a)return;const active=isActive(a)||state.demo;
 $("#modal-root").innerHTML=`<div class="modal-backdrop"><div class="modal"><button class="icon-btn modal-close" id="close-modal">×</button><div class="ad-image" style="height:260px;border-radius:16px;background-image:url('${esc(imgFor(a))}')"></div><span class="badge badge-gold" style="margin-top:15px">${esc(a.category)}</span><h2>${esc(a.title)}</h2><p class="muted">${esc(a.description)}</p><div class="info-list"><div class="info-item"><span>Advertiser</span><b>${esc(a.advertiserName||"")}</b></div><div class="info-item"><span>Location</span><b>${esc(a.location||"")}</b></div><div class="info-item"><span>Contact</span><b>${esc(a.contact||"")}</b></div><div class="info-item"><span>Price</span><b>${money(a)}</b></div><div class="info-item"><span>Delivery</span><b>${a.freeDelivery?"Free":`${a.deliveryFee||0} ${a.deliveryCurrency||a.currency}`}</b></div></div><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-maroon" id="modal-message">Message advertiser</button>${a.category==="Goods"?'<button class="btn btn-cyan" id="modal-cart">Add to cart</button>':''}</div></div></div>`;
 $("#close-modal").onclick=()=>$("#modal-root").innerHTML="";$("#modal-message").onclick=()=>{ $("#modal-root").innerHTML="";openChatForAd(a.id)};$("#modal-cart")?.addEventListener("click",()=>{const cart=JSON.parse(localStorage.getItem("ivy_cart")||"[]");const found=cart.find(x=>x.id===a.id);if(found)found.qty++;else cart.push({...a,qty:1});localStorage.setItem("ivy_cart",JSON.stringify(cart));toast("Added to cart");$("#modal-root").innerHTML=""});
}
async function submitAdvert(e){
 e.preventDefault(); if(!state.user)return;
 const file=$("#ad-image").files[0], qr=$("#ad-qr").files[0], paymentRef=$("#ad-payment-ref").value.trim();
 try{
  let imageUrl="./assets/market-candy.jpg",qrUrl="";
  if(configured&&storage){
   const r=ref(storage,`adverts/${state.user.uid}/${Date.now()}-${file.name}`);await uploadBytes(r,file);imageUrl=await getDownloadURL(r);
   if(qr){const q=ref(storage,`adverts/${state.user.uid}/qr-${Date.now()}-${qr.name}`);await uploadBytes(q,qr);qrUrl=await getDownloadURL(q)}
  }
  const ad={advertiserId:state.user.uid,advertiserName:state.profile.fullName||state.profile.username,businessName:state.profile.businessName||state.profile.username,title:$("#ad-title").value.trim(),category:$("#ad-category").value,description:$("#ad-description").value.trim(),location:$("#ad-location").value.trim(),contact:$("#ad-contact").value.trim(),price:Number($("#ad-price").value),currency:$("#ad-currency").value,deliveryFee:Number($("#ad-delivery").value||0),deliveryCurrency:$("#ad-delivery-currency").value,freeDelivery:$("#ad-free-delivery").checked,imageUrl,qrUrl,status:"pending_payment",paymentReference:paymentRef,createdAt:serverTimestamp()};
  if(configured){const refDoc=await addDoc(collection(db,"adverts"),ad);await addDoc(collection(db,"payments"),{type:"advert_subscription",advertId:refDoc.id,userId:state.user.uid,amount:0.05,currency:"USD",method:"EcoCash",recipient:"263785932494",reference:paymentRef,status:"pending",createdAt:serverTimestamp()});}
  else {ad.id="demo-"+Date.now();ad.status="active";ad.expiresAt=new Date(Date.now()+259200000);state.ads.unshift(ad)}
  toast(configured?"Advert submitted. Waiting for payment verification.":"Demo advert created.");navigate(state.role==="advertiser"?"dashboard":"explore");
 }catch(err){toast(err.message||"Could not submit advert","err")}
}
function renew(){
 $("#modal-root").innerHTML=`<div class="modal-backdrop"><div class="modal"><button class="icon-btn modal-close" id="close-modal">×</button><h2>Renew advert visibility</h2><p class="muted">Send <strong>$0.05 USD</strong> to EcoCash <strong>263 785 932 494</strong>, then enter the reference.</p><label>EcoCash reference<input id="renew-ref" placeholder="Payment reference" required></label><button class="btn btn-maroon btn-full" id="submit-renew">Submit renewal request</button></div></div>`;
 $("#close-modal").onclick=()=>$("#modal-root").innerHTML="";$("#submit-renew").onclick=async()=>{const reference=$("#renew-ref").value.trim();if(!reference)return toast("Enter the payment reference","err");try{if(configured)await addDoc(collection(db,"payments"),{type:"renewal",userId:state.user.uid,amount:0.05,currency:"USD",method:"EcoCash",recipient:"263785932494",reference,status:"pending",createdAt:serverTimestamp()});toast("Renewal request submitted for verification.");$("#modal-root").innerHTML=""}catch(e){toast(e.message,"err")}};
}
function editProfile(){
 const p=state.profile||{};$("#modal-root").innerHTML=`<div class="modal-backdrop"><div class="modal"><button class="icon-btn modal-close" id="close-modal">×</button><h2>Edit profile</h2><form id="profile-form"><div class="form-grid"><label>Username<input id="p-username" value="${esc(p.username||"")}"></label><label>Full name<input id="p-name" value="${esc(p.fullName||"")}"></label><label>Phone / WhatsApp<input id="p-phone" value="${esc(p.phone||"")}"></label><label>Location<input id="p-location" value="${esc(p.location||"")}"></label><label class="form-full">Business name<input id="p-business" value="${esc(p.businessName||"")}"></label><label class="form-full">Bio / business description<textarea id="p-bio">${esc(p.bio||"")}</textarea></label></div><button class="btn btn-maroon btn-full">Save profile</button></form></div></div>`;
 $("#close-modal").onclick=()=>$("#modal-root").innerHTML="";$("#profile-form").onsubmit=async e=>{e.preventDefault();const update={username:$("#p-username").value.trim(),fullName:$("#p-name").value.trim(),phone:$("#p-phone").value.trim(),location:$("#p-location").value.trim(),businessName:$("#p-business").value.trim(),bio:$("#p-bio").value.trim()};try{if(configured)await updateDoc(doc(db,"users",state.user.uid),update);Object.assign(state.profile,update);toast("Profile updated");$("#modal-root").innerHTML="";renderShell();renderView()}catch(err){toast(err.message,"err")}};
}
function openChatForAd(id){state.activeChat=id;navigate("messages")}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function start(){
 if(configured){
  onAuthStateChanged(auth,async user=>{if(user){state.user=user;await loadProfile();state.view=state.role==="advertiser"?"dashboard":"explore";showApp()}else{$("#app-screen").classList.add("hidden");$("#landing").classList.remove("hidden")}})
 }else{
  // Static mode: Firebase is not configured yet. The demo remains usable without Node/npm.
  $("#landing").classList.remove("hidden");
 }
}
start();
