// ============================================================
// firebase.js — Firebase config + shared utilities
// ============================================================
import { initializeApp }                            from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, doc, collection, getDoc, getDocs,
         setDoc, addDoc, updateDoc, deleteDoc, query,
         where, orderBy, limit, onSnapshot, serverTimestamp,
         Timestamp }                                from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         signOut }                                  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// ── Config ──
const firebaseConfig = {
  apiKey:            "AIzaSyBahB8D9Lc-MzaCc2YUNOatzZrxOzlN3jA",
  authDomain:        "fuboru-counter.firebaseapp.com",
  projectId:         "fuboru-counter",
  storageBucket:     "fuboru-counter.firebasestorage.app",
  messagingSenderId: "912813998474",
  appId:             "1:912813998474:web:70a3ffd6f51d25213f4873"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── Auth helpers ──
async function requireAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) { window.location.href = '/login.html'; return; }
      // Ambil profil dari Firestore
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : { role: 'viewer', full_name: user.email };
      resolve({ ...profile, uid: user.uid, email: user.email });
    });
  });
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') { window.location.href = '/index.html'; }
  return user;
}

async function logout() {
  await signOut(auth);
  window.location.href = '/login.html';
}

// ── Format helpers ──
function formatDate(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

function formatDateTime(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '-';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function timeAgo(ts) {
  if (!ts) return '-';
  const d    = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff/60)}m lalu`;
  if (diff < 86400)return `${Math.floor(diff/3600)}j lalu`;
  return formatDate(ts);
}

// ── Toast ──
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  const colors = { success:'#22C55E', error:'#EF4444', info:'#3B82F6', warning:'#EAB308' };
  t.style.cssText = `background:#1E1E1E;border:1px solid ${colors[type]||colors.success};border-radius:10px;
    padding:12px 18px;font-size:13px;color:#F1F5F9;box-shadow:0 8px 24px rgba(0,0,0,0.4);
    animation:slideIn 0.3s ease;max-width:320px;display:flex;align-items:center;gap:8px`;
  t.innerHTML = `<span style="color:${colors[type]||colors.success};font-size:16px">${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span>${msg}`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

// ── Modal helpers ──
function openModal(id)  { const m = document.getElementById(id); if(m) m.style.display='flex'; }
function closeModal(id) { const m = document.getElementById(id); if(m) m.style.display='none'; }

// ── Sidebar render ──
function renderSidebar(activeId, userRole) {
  const adminOnly = userRole === 'admin';
  const adminStyle = adminOnly ? '' : 'display:none';
  return `
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="logo">F</div>
      <div class="brand-info"><h2>Fuboru Counter</h2><p>Production Monitor</p></div>
    </div>
    <nav class="sidebar-nav">
      <a class="nav-item ${activeId==='index'?'active':''}" href="/index.html">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Live Counter
      </a>
      <a class="nav-item ${activeId==='analytics'?'active':''}" href="/analytics.html">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
        Analytics
      </a>
      <a class="nav-item ${activeId==='history'?'active':''}" href="/history.html">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        History Log
      </a>
      <div class="nav-section" style="${adminStyle}">Admin</div>
      <a class="nav-item ${activeId==='operators'?'active':''}" href="/operators.html" style="${adminStyle}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Operator & RFID
      </a>
      <a class="nav-item ${activeId==='products'?'active':''}" href="/products.html" style="${adminStyle}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        Produk & Target
      </a>
      <a class="nav-item ${activeId==='machines'?'active':''}" href="/machines-admin.html" style="${adminStyle}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Kelola Mesin
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-chip">
        <div class="user-avatar" id="userAvatar">A</div>
        <div class="user-info">
          <div class="name" id="userName">-</div>
          <div class="role" id="userRole">-</div>
        </div>
        <button class="logout-btn" id="logoutBtn">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    </div>
  </aside>`;
}

function initSidebar(user) {
  document.getElementById('userName').textContent   = user.full_name || user.email;
  document.getElementById('userRole').textContent   = user.role;
  document.getElementById('userAvatar').textContent = (user.full_name || user.email).charAt(0).toUpperCase();
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

export {
  app, db, auth,
  requireAuth, requireAdmin, logout,
  formatDate, formatDateTime, formatDuration, timeAgo,
  showToast, openModal, closeModal,
  renderSidebar, initSidebar,
  // re-export firestore functions
  doc, collection, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp
};
