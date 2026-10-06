/**
 * Trova l'Ultimo - App Logic v3.0
 * Scouting Radar, In-App Chat, Mandatory Player Card Onboarding,
 * Geolocation GPS, 3D Holographic Card, and Post-Match Star Reviews.
 */

// Application State
let savedUser = JSON.parse(localStorage.getItem('trova_user') || 'null');
if (savedUser && !savedUser.player_id && savedUser.id) {
  savedUser.player_id = "user_" + savedUser.id;
  localStorage.setItem('trova_user', JSON.stringify(savedUser));
}

const state = {
  currentTab: 'feed',
  soundEnabled: false,
  currentUser: savedUser,
  filters: {
    format: 'all',
    role: 'all',
    search: '',
    scoutRole: 'all',
    scoutTrait: 'all'
  },
  matches: [],
  availabilities: [],
  conversations: [],
  activeMatchForPitch: null,
  activeScoutChat: null,
  profile: null,
  savedProfile: null,
  isCardDirty: false,
  draftPhotoUrl: null,
  draftCardTheme: null,
  isCardFlipped: false,
  authMode: 'login',
  currentGpsCoords: null,
  pendingActionAfterAuth: null
};

function getCurrentPlayerId() {
  if (!state.currentUser) return "my_profile";
  return state.currentUser.player_id || ("user_" + state.currentUser.id) || "my_profile";
}

// Silent Audio / No WebAudio synth context
const SoundFX = {
  playWhistle() {},
  playGoalCheer() {},
  playClick() {}
};

function toggleSound() {}

// ----------------------------------------------------
// GEOLOCATION & RADAR DISTANCE CALCULATION
// ----------------------------------------------------
const CITY_COORDS = {
  'scordia': { lat: 37.2964, lng: 14.8462 },
  'catania': { lat: 37.5079, lng: 15.0873 },
  'palermo': { lat: 38.1157, lng: 13.3615 },
  'messina': { lat: 38.1938, lng: 15.5540 },
  'siracusa': { lat: 37.0755, lng: 15.2866 },
  'ragusa': { lat: 36.9269, lng: 14.7306 },
  'caltagirone': { lat: 37.2382, lng: 14.5126 },
  'lentini': { lat: 37.2858, lng: 14.9996 },
  'francofonte': { lat: 37.2285, lng: 14.8772 },
  'palagonia': { lat: 37.3323, lng: 14.7478 },
  'militello in val di catania': { lat: 37.2742, lng: 14.7937 },
  'agrigento': { lat: 37.3106, lng: 13.5766 },
  'trapani': { lat: 38.0176, lng: 12.5365 },
  'enna': { lat: 37.5676, lng: 14.2794 },
  'caltanissetta': { lat: 37.4922, lng: 14.0625 },
  'milano': { lat: 45.4642, lng: 9.1900 },
  'monza': { lat: 45.5845, lng: 9.2744 },
  'sesto san giovanni': { lat: 45.5328, lng: 9.2274 },
  'cinisello balsamo': { lat: 45.5562, lng: 9.2139 },
  'cinisello': { lat: 45.5562, lng: 9.2139 },
  'rho': { lat: 45.5317, lng: 9.0402 },
  'legnano': { lat: 45.5966, lng: 8.9134 },
  'cologno monzese': { lat: 45.5292, lng: 9.2785 },
  'san donato': { lat: 45.4184, lng: 9.2731 },
  'segrate': { lat: 45.4925, lng: 9.2974 },
  'rozzano': { lat: 45.3855, lng: 9.1539 },
  'corsico': { lat: 45.4319, lng: 9.1105 },
  'bresso': { lat: 45.5392, lng: 9.1914 },
  'cusano milanino': { lat: 45.5528, lng: 9.1866 },
  'paderno dugnano': { lat: 45.5707, lng: 9.1673 },
  'bollate': { lat: 45.5458, lng: 9.1186 },
  'pioltello': { lat: 45.4984, lng: 9.3276 },
  'bergamo': { lat: 45.6983, lng: 9.6773 },
  'brescia': { lat: 45.5416, lng: 10.2118 },
  'pavia': { lat: 45.1847, lng: 9.1582 },
  'como': { lat: 45.8081, lng: 9.0852 },
  'varese': { lat: 45.8206, lng: 8.8251 },
  'lodi': { lat: 45.3142, lng: 9.5033 },
  'lecco': { lat: 45.8566, lng: 9.3977 },
  'cremona': { lat: 45.1332, lng: 10.0247 },
  'mantova': { lat: 45.1564, lng: 10.7914 },
  'roma': { lat: 41.9028, lng: 12.4964 },
  'fiumicino': { lat: 41.7678, lng: 12.2289 },
  'torino': { lat: 45.0703, lng: 7.6869 },
  'moncalieri': { lat: 45.0006, lng: 7.7011 },
  'napoli': { lat: 40.8518, lng: 14.2681 },
  'salerno': { lat: 40.6824, lng: 14.7681 },
  'caserta': { lat: 41.0722, lng: 14.3323 },
  'bologna': { lat: 44.4949, lng: 11.3426 },
  'modena': { lat: 44.6471, lng: 10.9252 },
  'reggio emilia': { lat: 44.6982, lng: 10.6312 },
  'parma': { lat: 44.8015, lng: 10.3279 },
  'firenze': { lat: 43.7696, lng: 11.2558 },
  'prato': { lat: 43.8777, lng: 11.1022 },
  'pisa': { lat: 43.7228, lng: 10.4017 },
  'genova': { lat: 44.4056, lng: 8.9463 },
  'verona': { lat: 45.4384, lng: 10.9916 },
  'padova': { lat: 45.4064, lng: 11.8768 },
  'venezia': { lat: 45.4408, lng: 12.3155 },
  'bari': { lat: 41.1171, lng: 16.8719 },
  'taranto': { lat: 40.4644, lng: 17.2470 },
  'lecce': { lat: 40.3515, lng: 18.1750 },
  'reggio calabria': { lat: 38.1113, lng: 15.6473 },
  'cosenza': { lat: 39.2983, lng: 16.2537 },
  'catanzaro': { lat: 38.9098, lng: 16.5960 },
  'cagliari': { lat: 39.2238, lng: 9.1217 },
  'sassari': { lat: 40.7259, lng: 8.5556 },
  'perugia': { lat: 43.1107, lng: 12.3908 },
  'ancona': { lat: 43.6158, lng: 13.5189 },
  'trento': { lat: 46.0748, lng: 11.1217 },
  'trieste': { lat: 45.6495, lng: 13.7768 }
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

function resolveCoordinates(cityStr, lat = null, lng = null) {
  if (lat != null && lng != null && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && parseFloat(lat) !== 0) {
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  }
  const clean = (cityStr || '').trim().toLowerCase();
  if (!clean) return null;
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      return coords;
    }
  }
  return null;
}

function getUserCoordinates() {
  if (state.currentGpsCoords && state.currentGpsCoords.lat != null) {
    return state.currentGpsCoords;
  }
  const userCity = (state.profile?.city || state.currentUser?.city || '').trim().toLowerCase();
  if (userCity) {
    const coords = resolveCoordinates(userCity);
    if (coords) return coords;
  }
  return { lat: 45.4642, lng: 9.1900 };
}

async function refreshUserCoordinates() {
  const userCity = (state.profile?.city || state.currentUser?.city || '').trim().toLowerCase();
  if (!userCity) return;
  if (!resolveCoordinates(userCity)) {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(userCity)}`);
      if (res.ok) {
        const data = await res.json();
        CITY_COORDS[userCity] = { lat: data.latitude, lng: data.longitude };
        renderMatches();
        renderAvailabilities();
      }
    } catch(e) {}
  }
}

function initRealGPS() {
  const savedGps = localStorage.getItem('trova_user_gps');
  if (savedGps) {
    try {
      state.currentGpsCoords = JSON.parse(savedGps);
    } catch(e) {}
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.currentGpsCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        localStorage.setItem('trova_user_gps', JSON.stringify(state.currentGpsCoords));
        renderMatches();
        renderAvailabilities();
      },
      () => {},
      { timeout: 6000 }
    );
  }
}

// ----------------------------------------------------
// TAB SWITCHING & ONBOARDING
// ----------------------------------------------------
function switchTab(tabId) {
  SoundFX.playClick();

  // If user was editing the player card and leaves without saving, revert to official saved card
  if ((state.currentTab === 'card' || state.currentTab === 'profile') && (tabId !== 'card' && tabId !== 'profile') && state.isCardDirty) {
    discardCardEdits();
  }

  // Mandatory auth: User must register/login before creating a match
  if (tabId === 'create' && !state.currentUser) {
    requireAuthAndExecute(() => switchTab('create'));
    return;
  }

  state.currentTab = tabId;

  // Dismiss any open modals or overlays when user navigates to another tab
  if (typeof closeFeedbackModal === 'function') closeFeedbackModal();
  if (typeof closeChatCenterModal === 'function') closeChatCenterModal();
  if (typeof closePitchModal === 'function') closePitchModal();
  if (typeof closeAvailabilityModal === 'function') closeAvailabilityModal();
  if (typeof closeMatchApplicationsModal === 'function') closeMatchApplicationsModal();
  if (typeof closeScoutMessageModal === 'function') closeScoutMessageModal();
  if (typeof closeApplyModal === 'function') closeApplyModal();
  if (typeof closeAuthModal === 'function') closeAuthModal();
  if (typeof closeNotificationsModal === 'function') closeNotificationsModal();
  document.body.classList.remove('overflow-hidden');

  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) activeTab.classList.remove('hidden');

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (!btn.id.includes('admin')) {
      btn.classList.remove('bg-emerald-500', 'text-slate-950', 'shadow-lg', 'shadow-emerald-500/25');
      btn.classList.add('text-slate-200');
    }
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn && !tabId.includes('admin')) {
    activeBtn.classList.remove('text-slate-200');
    activeBtn.classList.add('bg-emerald-500', 'text-slate-950', 'shadow-lg', 'shadow-emerald-500/25');
  }

  // Update mobile bottom nav active tab
  document.querySelectorAll('.mob-nav-btn').forEach(btn => {
    btn.classList.remove('text-emerald-400', 'font-bold');
    btn.classList.add('text-slate-400', 'font-medium');
  });
  const mobTabKey = (tabId === 'profile') ? 'card' : tabId;
  const activeMobBtn = document.getElementById(`mob-nav-${mobTabKey}`);
  if (activeMobBtn) {
    activeMobBtn.classList.remove('text-slate-400', 'font-medium');
    activeMobBtn.classList.add('text-emerald-400', 'font-bold');
  }

  if (tabId === 'feed') {
    fetchMatches();
  } else if (tabId === 'scouting') {
    fetchAvailabilities();
  } else if (tabId === 'card' || tabId === 'profile') {
    fetchUserProfile();
    loadUserMatchHistory();
  } else if (tabId === 'chat') {
    loadChatConversations();
  } else if (tabId === 'admin') {
    loadAdminData();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function requireAuthAndExecute(actionFn) {
  if (!state.currentUser) {
    state.pendingActionAfterAuth = actionFn;
    openAuthModal('register');
    return;
  }
  actionFn();
}

function dismissOnboarding() {
  document.getElementById('onboardingBanner').classList.add('hidden');
}

// ----------------------------------------------------
// AUTHENTICATION & LOGIN/REGISTRATION
// ----------------------------------------------------
function updateAuthUI() {
  const container = document.getElementById('authNavContainer');
  const adminNavBtn = document.getElementById('nav-admin');

  if (state.currentUser) {
    const isAdmin = Boolean(state.currentUser.is_admin);
    if (adminNavBtn) {
      if (isAdmin) adminNavBtn.classList.remove('hidden');
      else adminNavBtn.classList.add('hidden');
    }

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-200 hidden sm:inline truncate max-w-[120px]">
          ${state.currentUser.full_name}
        </span>
        ${isAdmin ? `<span class="bg-rose-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">ADMIN</span>` : ''}
        <button onclick="logout()" class="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition" title="Esci">
          <i data-lucide="log-out" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  } else {
    if (adminNavBtn) adminNavBtn.classList.add('hidden');
    container.innerHTML = `
      <button onclick="openAuthModal()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition">
        <i data-lucide="user" class="w-3.5 h-3.5 text-emerald-400"></i>
        <span>Accedi / Registrati</span>
      </button>
    `;
  }
  lucide.createIcons();
  checkPendingReviews();
  checkPlayerNotifications();
}

function openAuthModal(defaultMode = 'login') {
  SoundFX.playClick();
  state.authMode = defaultMode;
  const regFields = document.getElementById('registerFields');
  const title = document.getElementById('authModalTitle');
  const btn = document.getElementById('authSubmitBtn');
  const toggleBtn = document.getElementById('authToggleModeBtn');

  if (state.authMode === 'register') {
    regFields.classList.remove('hidden');
    title.innerText = "Registrati su Trova l'Ultimo";
    btn.innerText = "CREA ACCOUNT & SCHEDA GIOCATORE";
    toggleBtn.innerText = "Hai già un account? Accedi qui";
  } else {
    regFields.classList.add('hidden');
    title.innerText = "Accedi al tuo Account";
    btn.innerText = "ACCEDI ORA";
    toggleBtn.innerText = "Non hai ancora un account? Registrati qui";
  }

  document.getElementById('authModal').classList.remove('hidden');
  document.getElementById('authModal').classList.add('flex');
}

function closeAuthModal() {
  SoundFX.playClick();
  document.getElementById('authModal').classList.add('hidden');
  document.getElementById('authModal').classList.remove('flex');
}

function toggleAuthMode() {
  openAuthModal(state.authMode === 'login' ? 'register' : 'login');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  SoundFX.playClick();

  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  if (state.authMode === 'login') {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Accesso non riuscito');

      state.currentUser = data.user;
      localStorage.setItem('trova_user', JSON.stringify(data.user));
      closeAuthModal();
      updateAuthUI();
      checkPendingReviews();
      fetchUserNotifications();
      SoundFX.playWhistle();

      if (data.is_admin) {
        switchTab('admin');
      } else {
        fetchUserProfile();
        if (state.pendingActionAfterAuth) {
          state.pendingActionAfterAuth();
          state.pendingActionAfterAuth = null;
        }
      }
    } catch (err) {
      alert(err.message);
    }
  } else {
    // Mandatory registration flow
    const fullName = document.getElementById('authFullName').value.trim();
    const phone = document.getElementById('authPhone').value.trim();
    const email = document.getElementById('authEmail').value.trim();

    if (!fullName || !phone || !email) {
      alert("Compila tutti i campi obbligatori!");
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
          phone: phone,
          primary_role: "Centrocampista",
          city: "Milano"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registrazione fallita');

      state.currentUser = data.user;
      localStorage.setItem('trova_user', JSON.stringify(data.user));
      closeAuthModal();
      updateAuthUI();
      checkPendingReviews();
      fetchUserNotifications();
      SoundFX.playGoalCheer();
      confetti({ particleCount: 100, spread: 80 });

      // MANDATORY REDIRECT TO PLAYER CARD TAB!
      const welcomeName = document.getElementById('onboardingWelcomeName');
      if (welcomeName) welcomeName.innerText = `Benvenuto, ${fullName}!`;
      document.getElementById('onboardingBanner').classList.remove('hidden');

      switchTab('card');
      fetchUserProfile();
    } catch (err) {
      alert(err.message);
    }
  }
}

function logout() {
  SoundFX.playClick();
  state.currentUser = null;
  localStorage.removeItem('trova_user');
  updateAuthUI();
  checkPendingReviews();
  fetchUserNotifications();
  updateNotificationBadges(0);
  switchTab('feed');
  alert("Disconnessione effettuata.");
}

// ----------------------------------------------------
// SCOUTING & PLAYER AVAILABILITIES
// ----------------------------------------------------
async function fetchAvailabilities() {
  const grid = document.getElementById('availabilitiesGrid');
  grid.innerHTML = `
    <div class="col-span-full py-12 text-center text-slate-400">
      <i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2"></i>
      Ricerca giocatori disponibili in corso...
    </div>
  `;
  lucide.createIcons();

  const search = document.getElementById('scoutSearchInput')?.value.trim() || '';
  let url = `/api/availabilities?role=${state.filters.scoutRole}`;
  if (search) url += `&q=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    state.availabilities = data.availabilities || [];
    renderAvailabilities();
  } catch (err) {
    console.error(err);
  }
}

function setScoutTraitFilter(trait) {
  state.filters.scoutTrait = trait;
  document.querySelectorAll('.scout-trait-btn').forEach(btn => {
    btn.className = "scout-trait-btn px-2.5 py-0.5 rounded-lg font-bold bg-slate-900 text-slate-300 border border-slate-700 hover:text-white";
  });
  const activeBtn = document.getElementById(`scout-trait-${trait}`);
  if (activeBtn) {
    activeBtn.className = "scout-trait-btn active px-2.5 py-0.5 rounded-lg font-bold bg-slate-800 text-cyan-300 border border-cyan-500/50";
  }
  renderAvailabilities();
}

function getDoubleReliability(av) {
  const presenza = av.reliability_score !== undefined && av.reliability_score !== null ? av.reliability_score : 100;
  const fedeltaRating = av.card_accuracy_rating !== undefined && av.card_accuracy_rating !== null ? parseFloat(av.card_accuracy_rating) : 5.0;
  const fedeltaScore = Math.round(fedeltaRating * 20); // 5.0 -> 100
  const combined = Math.round((presenza + fedeltaScore) / 2);
  return { presenza, fedeltaRating, fedeltaScore, combined };
}

function renderAvailabilities() {
  const grid = document.getElementById('availabilitiesGrid');
  const userCoords = getUserCoordinates();
  const radiusFilter = document.getElementById('scoutRadiusSelect')?.value || '30';
  const formatFilter = document.getElementById('scoutFormatSelect')?.value || 'all';
  const scoutSearch = (document.getElementById('scoutSearchInput')?.value || '').trim().toLowerCase();

  // 1. Filtering: by Format and Radar Radius (NO EXCLUSION by trait - keep all players!)
  let list = (state.availabilities || []).filter(av => {
    // Format filter
    if (formatFilter !== 'all' && av.preferred_format) {
      const pf = (av.preferred_format + '').toLowerCase();
      if (!pf.includes(formatFilter) && !pf.includes('tutti') && !pf.includes('tutte')) {
        return false;
      }
    }

    // Distance calculation
    const avCoords = resolveCoordinates(av.city, av.latitude, av.longitude);
    if (userCoords && avCoords) {
      av._distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, avCoords.lat, avCoords.lng);
    } else {
      av._distanceKm = null;
    }

    // When user types in search bar (city, zone, or name), search takes precedence across all players in Italy
    if (scoutSearch) {
      const city = (av.city || '').toLowerCase();
      const name = (av.player_name || av.name || '').toLowerCase();
      const zone = (av.zone || '').toLowerCase();
      return city.includes(scoutSearch) || name.includes(scoutSearch) || zone.includes(scoutSearch);
    }

    // Radar radius filter (only applied when not searching for a specific city/term)
    if (radiusFilter !== 'all' && av._distanceKm !== null) {
      const maxKm = parseInt(radiusFilter, 10);
      if (av._distanceKm > maxKm) return false;
    }

    return true;
  });

  // 2. Sorting based on user selection:
  const trait = state.filters.scoutTrait;
  list.sort((a, b) => {
    const relA = getDoubleReliability(a);
    const relB = getDoubleReliability(b);

    if (trait === 'vel') {
      const diff = (b.stats_vel || 75) - (a.stats_vel || 75);
      if (diff !== 0) return diff;
      return relB.combined - relA.combined;
    }
    if (trait === 'tir') {
      const diff = (b.stats_tir || 75) - (a.stats_tir || 75);
      if (diff !== 0) return diff;
      return relB.combined - relA.combined;
    }
    if (trait === 'dif') {
      const diff = (b.stats_dif || 75) - (a.stats_dif || 75);
      if (diff !== 0) return diff;
      return relB.combined - relA.combined;
    }
    if (trait === 'reliability') {
      // Prioritize combined double reliability (Presenza + Fedeltà Scheda)
      if (relB.combined !== relA.combined) {
        return relB.combined - relA.combined;
      }
      if (relB.presenza !== relA.presenza) {
        return relB.presenza - relA.presenza;
      }
      const distA = a._distanceKm !== null ? a._distanceKm : 999;
      const distB = b._distanceKm !== null ? b._distanceKm : 999;
      return distA - distB;
    }

    // Default 'all': 1. Closest distance in km -> 2. Combined Double Reliability -> 3. Stats
    const distA = a._distanceKm !== null ? a._distanceKm : 999;
    const distB = b._distanceKm !== null ? b._distanceKm : 999;
    if (Math.abs(distA - distB) > 5) {
      return distA - distB;
    }

    if (relB.combined !== relA.combined) {
      return relB.combined - relA.combined;
    }

    return (b.stats_vel || 75) - (a.stats_vel || 75);
  });

  if (!list.length) {
    const emptyTitle = scoutSearch
      ? `Nessun giocatore disponibile trovato per "${scoutSearch}"`
      : `Nessun giocatore disponibile entro ${radiusFilter} km`;
    const emptyDesc = scoutSearch
      ? `Non ci sono al momento giocatori disponibili registrati per questa ricerca. Puoi essere il primo ad attivare la tua disponibilità qui!`
      : `Nessun giocatore libero entro il raggio selezionato. Prova ad aumentare il radar a 50 km o cerca direttamente la tua città nella barra di ricerca.`;

    grid.innerHTML = `
      <div class="col-span-full py-12 text-center glass-panel rounded-3xl border border-slate-800">
        <i data-lucide="radar" class="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-50"></i>
        <h4 class="text-white font-bold">${emptyTitle}</h4>
        <p class="text-xs text-slate-300 mt-1">${emptyDesc}</p>
        <button onclick="openAvailabilityModal()" class="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">
          Attiva la tua Disponibilità
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = list.map(av => {
    const isMyCard = Boolean(state.currentUser && (
      (av.player_id && (av.player_id === state.currentUser.player_id || av.player_id === 'user_' + state.currentUser.id || av.player_id === state.currentUser.username)) ||
      (av.player_name && state.currentUser.full_name && av.player_name.toLowerCase() === state.currentUser.full_name.toLowerCase())
    ));
    const isBooked = av.status === 'booked';
    const rel = getDoubleReliability(av);

    return `
      <div class="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl flex flex-col justify-between group text-center sm:text-left">
        <div>
          <!-- Header: Centered on mobile -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 text-center sm:text-left">
            <div class="flex flex-col sm:flex-row items-center gap-3">
              <img src="${av.photo_url || '/static/avatars/bomber.svg'}" class="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md bg-slate-900 mx-auto sm:mx-0">
              <div class="flex flex-col items-center sm:items-start">
                <div class="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h4 class="text-base font-black text-white">${av.player_name}</h4>
                  <span class="text-xs font-black text-cyan-300 uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30">${av.primary_role}</span>
                </div>
                <!-- Double Reliability Badges -->
                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${rel.presenza >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                    🛡️ Presenza: ${rel.presenza}%
                  </span>
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    🎯 Fedeltà: ${rel.fedeltaRating.toFixed(1)}/5
                  </span>
                  <span class="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    ⭐ ${rel.combined}% Totale
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-row sm:flex-col items-center sm:items-end justify-center gap-1.5 mt-1 sm:mt-0">
              <span class="text-[10px] font-black uppercase tracking-wider ${isBooked ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'} px-2.5 py-0.5 rounded-full border flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full ${isBooked ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}"></span>
                ${isBooked ? 'CONVOCATO' : 'DISPONIBILE'}
              </span>
              ${av._distanceKm !== null ? `
                <span class="text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <i data-lucide="navigation" class="w-3 h-3 text-cyan-400"></i>
                  📍 ${av._distanceKm} km da te
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Availability Details Grid: 4 Centered Tiles -->
          <div class="grid grid-cols-2 gap-2 text-center text-xs py-2.5 px-3 bg-slate-950/80 rounded-2xl border border-slate-800 font-medium">
            <div class="p-2 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center">
              <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">DATA:</span>
              <span class="font-black text-white">${av.available_date}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center">
              <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">ORARI:</span>
              <span class="font-black text-amber-300">${av.time_slot}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center">
              <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">ZONA:</span>
              <span class="font-black text-white truncate max-w-full">${av.zone} (${av.city})</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center">
              <span class="text-[10px] text-slate-400 font-bold uppercase mb-0.5">FORMATO:</span>
              <span class="font-black text-white">${av.preferred_format}</span>
            </div>
          </div>

          <!-- Top Stats Preview: Centered -->
          <div class="flex items-center justify-center gap-2 mt-2.5 px-3 py-1.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] font-black text-slate-300 text-center">
            <span>⚡ VEL ${av.stats_vel || 75}</span>
            <span>•</span>
            <span>🎯 TIR ${av.stats_tir || 75}</span>
            <span>•</span>
            <span>🧱 DIF ${av.stats_dif || 75}</span>
            <span>•</span>
            <span>⚙️ PAS ${av.stats_pas || 75}</span>
          </div>

          ${av.notes ? `
            <p class="mt-2 text-xs text-slate-300 italic line-clamp-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 text-center">
              "${av.notes}"
            </p>
          ` : ''}
        </div>

        <!-- Chat / Invia Messaggio o Gestione Propria Azioni -->
        <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center sm:justify-between gap-2 flex-wrap">
          ${isMyCard ? `
            <span class="text-xs font-bold text-cyan-300">La tua disponibilità</span>
            <div class="flex items-center justify-center gap-2">
              ${isBooked ? `
                <span class="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-xl">
                  🔒 Convocazione Confermata
                </span>
              ` : `
                <button onclick="openEditAvailabilityModal(${JSON.stringify(av).replace(/"/g, '&quot;')})" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/40 flex items-center gap-1 transition" title="Modifica orari o zona">
                  <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                  Modifica
                </button>
                <button onclick="deleteMyAvailability(${av.id})" class="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 flex items-center gap-1 transition" title="Rimuovi disponibilità">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  Rimuovi
                </button>
              `}
            </div>
          ` : `
            <button onclick="openChatCenterModal('${av.player_id}', '${(av.player_name || '').replace(/'/g, "\\'")}')" class="btn-shimmer w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition">
              <i data-lucide="message-square" class="w-4 h-4"></i>
              <span>Invia Messaggio / Chat</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function setScoutFilterRole(role) {
  state.filters.scoutRole = role;
  document.querySelectorAll('.scout-role-btn').forEach(btn => {
    btn.className = "scout-role-btn px-3 py-1 rounded-full text-xs font-bold border border-slate-700 text-slate-200";
  });
  const el = document.getElementById(`scout-role-${role}`);
  if (el) {
    el.className = "scout-role-btn active px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 border border-cyan-500 text-cyan-300";
  }
  fetchAvailabilities();
}

function openAvailabilityModal() {
  SoundFX.playClick();
  requireAuthAndExecute(() => {
    const editId = document.getElementById('availEditId');
    if (editId) editId.value = '';
    const title = document.getElementById('availabilityModalTitle');
    if (title) title.innerText = "Attiva la tua Disponibilità";
    const desc = document.getElementById('availabilityModalDesc');
    if (desc) desc.innerText = "Fatti scoutare dagli organizzatori! Inserisci quando sei libero e in che zona puoi giocare.";
    const btn = document.getElementById('availabilityModalSubmitBtn');
    if (btn) btn.innerText = "PUBBLICA DISPONIBILITÀ SUL RADAR";

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('availDate').value = today;
    const modal = document.getElementById('availabilityModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.scrollTop = 0;
    }
    document.body.classList.add('overflow-hidden');
    lucide.createIcons();
  });
}

function openEditAvailabilityModal(av) {
  SoundFX.playClick();
  requireAuthAndExecute(() => {
    document.getElementById('availEditId').value = av.id;
    document.getElementById('availDate').value = av.available_date || '';
    document.getElementById('availTimeSlot').value = av.time_slot || '';
    document.getElementById('availCity').value = av.city || 'Milano';
    document.getElementById('availZone').value = av.zone || '';
    document.getElementById('availRole').value = av.primary_role || 'Centrocampista';
    document.getElementById('availFormat').value = av.preferred_format || 'Calcio a 5, 6 o 7';
    document.getElementById('availNotes').value = av.notes || '';

    const title = document.getElementById('availabilityModalTitle');
    if (title) title.innerText = "Modifica la tua Disponibilità";
    const desc = document.getElementById('availabilityModalDesc');
    if (desc) desc.innerText = "Aggiorna data, orari o zona di gioco sul Radar Scouting.";
    const btn = document.getElementById('availabilityModalSubmitBtn');
    if (btn) btn.innerText = "SALVA MODIFICHE DISPONIBILITÀ";

    const modal = document.getElementById('availabilityModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      modal.scrollTop = 0;
    }
    document.body.classList.add('overflow-hidden');
    lucide.createIcons();
  });
}

async function deleteMyAvailability(availId) {
  SoundFX.playClick();
  if (!confirm("Vuoi rimuovere la tua disponibilità dal Radar Scouting?\nNon sarai più visibile agli organizzatori che cercano giocatori.")) {
    return;
  }
  try {
    const res = await fetch(`/api/availabilities/${availId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Impossibile rimuovere la disponibilità.");
      return;
    }
    alert(data.message || "Disponibilità rimossa con successo.");
    fetchAvailabilities();
  } catch (e) {
    alert("Errore nella rimozione della disponibilità.");
  }
}

function closeAvailabilityModal() {
  SoundFX.playClick();
  const modal = document.getElementById('availabilityModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.classList.remove('overflow-hidden');
  const editId = document.getElementById('availEditId');
  if (editId) editId.value = '';
  const title = document.getElementById('availabilityModalTitle');
  if (title) title.innerText = "Attiva la tua Disponibilità";
  const desc = document.getElementById('availabilityModalDesc');
  if (desc) desc.innerText = "Fatti scoutare dagli organizzatori! Inserisci quando sei libero e in che zona puoi giocare.";
  const btn = document.getElementById('availabilityModalSubmitBtn');
  if (btn) btn.innerText = "PUBBLICA DISPONIBILITÀ SUL RADAR";
}

async function handleCreateAvailability(e) {
  e.preventDefault();
  SoundFX.playWhistle();

  const editId = document.getElementById('availEditId')?.value;
  if (editId) {
    const editPayload = {
      primary_role: document.getElementById('availRole').value,
      city: document.getElementById('availCity').value,
      zone: document.getElementById('availZone').value,
      available_date: document.getElementById('availDate').value,
      time_slot: document.getElementById('availTimeSlot').value,
      preferred_format: document.getElementById('availFormat').value,
      notes: document.getElementById('availNotes').value
    };

    try {
      const res = await fetch(`/api/availabilities/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPayload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Errore nella modifica della disponibilità.");
        return;
      }
      alert(data.message || "Disponibilità aggiornata con successo!");
      closeAvailabilityModal();
      fetchAvailabilities();
    } catch (err) {
      alert("Errore nella modifica della disponibilità.");
    }
    return;
  }

  const p = state.profile || {
    name: state.currentUser.full_name,
    ovr: 81,
    photo_url: "/static/avatars/bomber.svg"
  };

  const payload = {
    player_id: state.currentUser.player_id || "my_profile",
    player_name: p.name,
    player_ovr: p.ovr || 78,
    photo_url: p.photo_url || "/static/avatars/bomber.svg",
    primary_role: document.getElementById('availRole').value,
    city: document.getElementById('availCity').value,
    zone: document.getElementById('availZone').value,
    available_date: document.getElementById('availDate').value,
    time_slot: document.getElementById('availTimeSlot').value,
    preferred_format: document.getElementById('availFormat').value,
    notes: document.getElementById('availNotes').value
  };

  try {
    const res = await fetch('/api/availabilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      confetti({ particleCount: 70, spread: 60 });
      alert(data.message);
      closeAvailabilityModal();
      fetchAvailabilities();
    }
  } catch (err) {
    alert("Errore nell'attivazione della disponibilità.");
  }
}

// ----------------------------------------------------
// IN-APP SCOUTING MESSAGING
// ----------------------------------------------------
async function openScoutMessageModal(avail) {
  SoundFX.playClick();
  requireAuthAndExecute(async () => {
    state.activeScoutChat = avail;
    document.getElementById('scoutChatRecipientName').innerText = avail.player_name;
    document.getElementById('scoutChatRecipientInfo').innerText = `${avail.primary_role} • ${avail.zone} (${avail.available_date})`;
    document.getElementById('scoutChatRecipientAvatar').src = avail.photo_url || '/static/avatars/bomber.svg';

    document.getElementById('scoutMessageModal').classList.remove('hidden');
    document.getElementById('scoutMessageModal').classList.add('flex');

    loadChatMessages(avail.id);
  });
}

function closeScoutMessageModal() {
  SoundFX.playClick();
  document.getElementById('scoutMessageModal').classList.add('hidden');
  document.getElementById('scoutMessageModal').classList.remove('flex');
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  try {
    let s = (dateStr + '').trim();
    // If it has 'T' or ends with 'Z' (ISO UTC string), convert to local time via Date
    if (s.includes('T') || s.endsWith('Z')) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    // If it has format "YYYY-MM-DD HH:MM:SS"
    if (s.includes(' ')) {
      const parts = s.split(' ');
      if (parts[1]) {
        return parts[1].slice(0, 5);
      }
    }
    return s.slice(11, 16);
  } catch(e) {
    return (dateStr + '').slice(11, 16);
  }
}

async function loadChatMessages(availId) {
  const thread = document.getElementById('scoutChatThread');
  thread.innerHTML = `<div class="text-center text-xs text-slate-400 py-4">Caricamento messaggi...</div>`;

  try {
    const res = await fetch(`/api/messages?availability_id=${availId}`);
    const data = await res.json();
    const messages = data.messages || [];

    if (!messages.length) {
      thread.innerHTML = `
        <div class="text-center text-xs text-slate-400 py-6">
          Nessun messaggio ancora. Scrivi per primo per convocare ${state.activeScoutChat.player_name}!
        </div>
      `;
      return;
    }

    const currentUserId = state.currentUser ? (state.currentUser.player_id || state.currentUser.username) : '';

    thread.innerHTML = messages.map(m => {
      const isMine = m.sender_id === currentUserId || m.sender_name === state.currentUser?.full_name;
      return `
        <div class="flex flex-col ${isMine ? 'items-end' : 'items-start'}">
          <span class="text-[10px] text-slate-400 font-bold mb-0.5">${m.sender_name}</span>
          <div class="max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-medium ${isMine ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'}">
            ${m.text}
          </div>
          <span class="text-[9px] text-slate-400 mt-0.5">${formatMessageTime(m.created_at)}</span>
        </div>
      `;
    }).join('');

    thread.scrollTop = thread.scrollHeight;
  } catch (err) {
    console.error(err);
  }
}

async function handleSendScoutMessage(e) {
  e.preventDefault();
  SoundFX.playClick();

  const input = document.getElementById('scoutChatMessageInput');
  const text = input.value.trim();
  if (!text || !state.activeScoutChat) return;

  const currentUserId = state.currentUser.player_id || state.currentUser.username;
  const currentUserName = state.currentUser.full_name;

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availability_id: state.activeScoutChat.id,
        sender_id: currentUserId,
        sender_name: currentUserName,
        recipient_id: state.activeScoutChat.player_id,
        recipient_name: state.activeScoutChat.player_name,
        text: text
      })
    });

    const data = await res.json();
    if (data.success) {
      input.value = '';
      loadChatMessages(state.activeScoutChat.id);
    }
  } catch (err) {
    alert("Errore nell'invio del messaggio.");
  }
}

// ----------------------------------------------------
// CHAT CENTER & CONVERSATION HISTORY
// ----------------------------------------------------
let activeChatPartnerId = null;

async function openChatCenterModal(partnerId = null, partnerName = null) {
  SoundFX.playClick();
  switchTab('chat');
  await loadChatConversations(partnerId, partnerName);
}

function closeChatCenterModal() {
  const modal = document.getElementById('chatCenterModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function loadChatConversations(autoSelectPartnerId = null, autoSelectName = null) {
  const notice = document.getElementById('chatLoginRequiredNotice');
  if (notice) {
    if (!state.currentUser) {
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  }

  const listEl = document.getElementById('chatConversationsList');
  if (!listEl) return;

  const currentUserId = getCurrentPlayerId();
  try {
    const res = await fetch(`/api/chat/conversations?user_id=${encodeURIComponent(currentUserId)}`);
    const data = await res.json();
    state.conversations = data.conversations || [];

    if (autoSelectPartnerId && !state.conversations.some(c => c.partner_id === autoSelectPartnerId)) {
      state.conversations.unshift({
        partner_id: autoSelectPartnerId,
        partner_name: autoSelectName || "Organizzatore / Giocatore",
        partner_photo: "/static/avatars/bomber.svg",
        partner_role: "Giocatore",
        partner_reliability: 100,
        last_message_text: "Inizia la conversazione...",
        last_message_time: new Date().toISOString()
      });
    }

    renderConversationsList();

    if (autoSelectPartnerId) {
      selectChatPartner(autoSelectPartnerId);
    } else if (state.conversations.length > 0 && window.innerWidth >= 640 && !activeChatPartnerId) {
      selectChatPartner(state.conversations[0].partner_id);
    }
  } catch(e) {
    console.error("Error loading conversations:", e);
  }
}

function renderConversationsList() {
  const listEl = document.getElementById('chatConversationsList');
  if (!listEl) return;

  const search = (document.getElementById('chatSearchConversationsInput')?.value || '').toLowerCase().trim();
  const filtered = state.conversations.filter(c => {
    if (!search) return true;
    return (c.partner_name || '').toLowerCase().includes(search) || (c.last_message_text || '').toLowerCase().includes(search);
  });

  if (!filtered.length) {
    listEl.innerHTML = `
      <div class="p-8 text-center text-slate-400 space-y-2">
        <i data-lucide="message-square" class="w-8 h-8 text-cyan-400/40 mx-auto"></i>
        <p class="text-xs">Nessuna conversazione trovata.</p>
        <p class="text-[11px] text-slate-500">I messaggi scambiati appariranno qui e rimarranno sempre salvati!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const isActive = c.partner_id === activeChatPartnerId;
    const timeDisplay = formatMessageTime(c.last_message_time);
    return `
      <div onclick="selectChatPartner('${c.partner_id}')" class="p-3.5 hover:bg-slate-800/60 cursor-pointer transition flex items-center gap-3 ${isActive ? 'bg-slate-800/90 border-l-4 border-cyan-400' : ''}">
        <img src="${c.partner_photo || '/static/avatars/bomber.svg'}" class="w-11 h-11 rounded-xl object-cover border border-slate-700 bg-slate-900 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1 mb-0.5">
            <h4 class="text-xs font-bold text-white truncate">${c.partner_name}</h4>
            <span class="text-[10px] text-slate-400 font-mono">${timeDisplay}</span>
          </div>
          <p class="text-[11px] text-cyan-300 font-medium truncate">${c.partner_role || 'Calciatore'}</p>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">${c.last_message_text || ''}</p>
        </div>
      </div>
    `;
  }).join('');
  lucide.createIcons();
}

function filterChatConversationsList() {
  renderConversationsList();
}

async function selectChatPartner(partnerId) {
  activeChatPartnerId = partnerId;
  renderConversationsList();

  const conv = state.conversations.find(c => c.partner_id === partnerId) || {
    partner_id: partnerId,
    partner_name: "Giocatore",
    partner_photo: "/static/avatars/bomber.svg",
    partner_role: "Giocatore",
    partner_reliability: 100
  };

  document.getElementById('chatPartnerName').innerText = conv.partner_name;
  document.getElementById('chatPartnerSubtitle').innerText = `${conv.partner_role || 'Giocatore'} • Affidabilità ${conv.partner_reliability || 100}%`;
  document.getElementById('chatPartnerAvatar').src = conv.partner_photo || '/static/avatars/bomber.svg';
  
  const relBadge = document.getElementById('chatPartnerReliabilityBadge');
  if (relBadge) {
    relBadge.innerText = `🛡️ ${conv.partner_reliability || 100}% Affidabile`;
  }

  // Mobile responsiveness
  if (window.innerWidth < 640) {
    document.getElementById('chatConversationsPanel').classList.add('hidden');
    document.getElementById('chatThreadPanel').classList.remove('hidden');
  }

  await loadChatTimeline(partnerId);
}

function chatBackToListOnMobile() {
  document.getElementById('chatConversationsPanel').classList.remove('hidden');
  document.getElementById('chatThreadPanel').classList.add('hidden');
}

async function loadChatTimeline(partnerId) {
  const scrollArea = document.getElementById('chatMessagesScrollView');
  if (!scrollArea) return;

  const currentUserId = getCurrentPlayerId();
  try {
    const res = await fetch(`/api/messages?user_id=${encodeURIComponent(currentUserId)}&partner_id=${encodeURIComponent(partnerId)}`);
    const data = await res.json();
    const msgs = data.messages || [];

    if (!msgs.length) {
      scrollArea.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
          <i data-lucide="message-square" class="w-8 h-8 text-cyan-400/40"></i>
          <p class="text-xs">Nessun messaggio precedente con questo utente.</p>
          <p class="text-[11px] text-slate-500">Invia un messaggio per accordarti sulla partita!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    scrollArea.innerHTML = msgs.map(m => {
      const isMine = m.sender_id === currentUserId || (state.currentUser && (m.sender_name === state.currentUser.full_name || m.sender_name === state.currentUser.username));
      const timeStr = formatMessageTime(m.created_at);
      return `
        <div class="flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1">
          <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md ${
            isMine ? 'bg-cyan-500 text-slate-950 rounded-tr-none font-bold' : 'bg-slate-800 text-white rounded-tl-none border border-slate-700'
          }">
            <p class="leading-relaxed whitespace-pre-wrap">${m.text}</p>
          </div>
          <span class="text-[10px] text-slate-500 font-mono px-1">${timeStr}</span>
        </div>
      `;
    }).join('');

    scrollArea.scrollTop = scrollArea.scrollHeight;
  } catch(e) {
    console.error("Error loading chat timeline:", e);
  }
}

async function handleChatCenterSend(e) {
  e.preventDefault();
  if (!state.currentUser) {
    requireAuthAndExecute(() => handleChatCenterSend(e));
    return;
  }
  const input = document.getElementById('chatCenterInput');
  if (!input || !activeChatPartnerId) return;
  const text = input.value.trim();
  if (!text) return;

  const currentUserId = getCurrentPlayerId();
  const currentUserName = state.currentUser ? (state.currentUser.full_name || state.currentUser.username) : "Giocatore";

  const conv = state.conversations.find(c => c.partner_id === activeChatPartnerId);
  const recipientName = conv ? conv.partner_name : "Giocatore";
  const availId = conv ? (conv.availability_id || 0) : 0;

  try {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availability_id: availId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        recipient_id: activeChatPartnerId,
        recipient_name: recipientName,
        text: text
      })
    });
    if (res.ok) {
      input.value = '';
      await loadChatTimeline(activeChatPartnerId);
      loadChatConversations(activeChatPartnerId);
    }
  } catch(e) {
    alert("Errore nell'invio del messaggio.");
  }
}

async function checkChatBadge() {
  const badge = document.getElementById('chatBadgeDot');
  const mobBadge = document.getElementById('mobChatBadgeDot');
  if (!state.currentUser) {
    if (badge) badge.classList.add('hidden');
    if (mobBadge) mobBadge.classList.add('hidden');
    return;
  }
  try {
    const currentUserId = getCurrentPlayerId();
    const res = await fetch(`/api/chat/conversations?user_id=${encodeURIComponent(currentUserId)}`);
    const data = await res.json();
    const hasUnread = (data.conversations || []).length > 0;
    if (badge) {
      if (hasUnread) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }
    if (mobBadge) {
      if (hasUnread) mobBadge.classList.remove('hidden');
      else mobBadge.classList.add('hidden');
    }
  } catch(e) {}
}

// ----------------------------------------------------
// MATCHES FEED & ACTIONS
// ----------------------------------------------------
async function fetchMatches() {
  const container = document.getElementById('matchesFeedContainer');
  try {
    let url = `/api/matches?format=${state.filters.format}&role=${state.filters.role}`;
    if (state.filters.search) url += `&q=${encodeURIComponent(state.filters.search)}`;
    const currentUserId = state.currentUser ? (state.currentUser.player_id || ('user_' + state.currentUser.id)) : null;
    if (currentUserId) url += `&user_id=${encodeURIComponent(currentUserId)}`;

    const res = await fetch(url);
    const data = await res.json();
    state.matches = data.matches || [];

    renderMatches();
    updateLiveTicker();
  } catch (err) {
    console.error(err);
  }
}

function isMatchCreator(match) {
  if (!state.currentUser || !match) return false;
  const user = state.currentUser;
  const userId = user.id ? String(user.id).trim() : '';
  const playerId = user.player_id ? String(user.player_id).trim() : '';
  const username = (user.username || '').trim().toLowerCase();
  const fullName = (user.full_name || '').trim().toLowerCase();
  const phone = (user.phone || '').replace(/[^0-9]/g, '');

  const mCreatorId = match.creator_id ? String(match.creator_id).trim() : '';
  const mCreatorUsername = (match.creator_username || '').trim().toLowerCase();
  const mOrgName = (match.organizer_name || '').trim().toLowerCase();
  const mOrgPhone = (match.organizer_phone || '').replace(/[^0-9]/g, '');

  return Boolean(
    (mCreatorId && (mCreatorId === userId || mCreatorId === playerId || mCreatorId === `user_${userId}`)) ||
    (mCreatorUsername && (mCreatorUsername === username || mCreatorUsername === playerId)) ||
    (mOrgName && (mOrgName === fullName || mOrgName === username)) ||
    (mOrgPhone && phone && mOrgPhone === phone)
  );
}

function renderMatches() {
  const container = document.getElementById('matchesFeedContainer');

  // Filter out concluded matches from main feed! Concluded matches are archived in user profile history.
  // ALSO filter out matches where all slots are complete / accepted (missing_count <= 0 or status == 'filled' or status == 'completed')!
  const activeMatches = (state.matches || []).filter(m => {
    // 1. Time check: match already concluded
    if (isMatchFinished(m.match_date, m.end_time || m.match_time)) return false;

    // 2. Slot check: match is full / completed / all spots filled
    const missing = typeof m.missing_count === 'number' ? m.missing_count : parseInt(m.missing_count || 0, 10);
    if (missing <= 0 || m.status === 'filled' || m.status === 'completed') {
      return false;
    }
    return true;
  });

  if (!activeMatches.length) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-panel rounded-3xl border border-slate-800 space-y-3">
        <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
          <i data-lucide="shield-check" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-black font-space text-white">Nessuna partita attiva in questo momento</h3>
        <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">Le partite recenti sono terminate o già al completo e sono state archiviate nello storico giocatori. Carica tu la tua partita per stasera o cerca compagni tra i giocatori disponibili!</p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button onclick="requireAuthAndExecute(() => switchTab('create'))" class="btn-shimmer px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            Carica la tua Partita
          </button>
          <button onclick="switchTab('scouting')" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2 transition">
            <i data-lucide="users" class="w-4 h-4"></i>
            Cerca Giocatore Disponibile
          </button>
        </div>
      </div>
    `;
    lucide.createIcons();
    updateLiveTicker();
    return;
  }

  // User's preferred zone/city from player card or account
  const now = Date.now();
  const userCity = ((state.profile?.city || state.currentUser?.city || '') + '').trim().toLowerCase();
  const userCoords = getUserCoordinates();
  const radiusFilter = document.getElementById('matchRadiusSelect')?.value || '30';
  const searchFilter = (state.filters.search || '').trim().toLowerCase();

  function getMatchRemainingMs(m) {
    try {
      const time = (m.match_time || '20:00').trim();
      const matchDate = new Date(`${m.match_date}T${time}:00`);
      return matchDate.getTime() - now;
    } catch (e) {
      return 999999999999;
    }
  }

  function getMatchDeadlineRemainingMs(m) {
    try {
      if (!m.deadline_time) return 999999999999;
      const matchDate = m.match_date || new Date().toISOString().slice(0, 10);
      const d = new Date(`${matchDate}T${m.deadline_time}:00`);
      return d.getTime() - now;
    } catch (e) {
      return 999999999999;
    }
  }

  // Radar radius filter & distance calculation
  const inRadiusMatches = activeMatches.filter(m => {
    const coords = resolveCoordinates(m.city, m.latitude, m.longitude);
    if (userCoords && coords) {
      m._distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
    } else {
      m._distanceKm = null;
    }

    // When searching for a city or word, search takes precedence across all matches in Italy
    if (searchFilter) {
      const matchCity = (m.city || '').toLowerCase();
      const matchField = (m.field_name || '').toLowerCase();
      const matchTitle = (m.title || '').toLowerCase();
      const matchAddress = (m.address || '').toLowerCase();
      return matchCity.includes(searchFilter) || matchField.includes(searchFilter) || matchTitle.includes(searchFilter) || matchAddress.includes(searchFilter);
    }

    // When not searching, filter strictly by selected GPS radius (15 / 30 / 50 km)
    if (m._distanceKm !== null) {
      const maxKm = parseInt(radiusFilter, 10) || 30;
      if (m._distanceKm > maxKm) return false;
    }
    return true;
  });

  if (!inRadiusMatches.length) {
    const emptyTitle = searchFilter 
      ? `Nessuna partita attiva trovata per "${state.filters.search}"`
      : `Nessuna partita attiva entro ${radiusFilter} km`;
    const emptyDesc = searchFilter
      ? `Al momento non ci sono partite aperte per la città o zona cercata. Puoi essere il primo a caricare una partita qui per trovare subito l'ultimo uomo!`
      : `Nessuna partita trovata entro questo raggio di distanza. Puoi espandere il radar a 50 km, cercare direttamente una città (es. Milano, Roma, Torino) o caricare tu la partita!`;

    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-panel rounded-3xl border border-slate-800 space-y-3">
        <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
          <i data-lucide="radar" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-black font-space text-white">${emptyTitle}</h3>
        <p class="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">${emptyDesc}</p>
        <div class="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button onclick="requireAuthAndExecute(() => switchTab('create'))" class="btn-shimmer px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            Carica la tua Partita
          </button>
          <button onclick="switchTab('scouting')" class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2 transition">
            <i data-lucide="users" class="w-4 h-4"></i>
            Cerca Giocatore Disponibile
          </button>
        </div>
      </div>
    `;
    lucide.createIcons();
    updateLiveTicker();
    return;
  }

  // Precedence Order:
  // 1. Luogo più vicino al giocatore (distanza in km o corrispondenza città)
  // 2. Orario della partita più vicino e più urgente
  // 3. Orario di chiusura della candidatura
  // 4. Persone mancanti
  const sortedMatches = [...inRadiusMatches].sort((a, b) => {
    // 1. Luogo più vicino al giocatore
    const distA = a._distanceKm !== null ? a._distanceKm : 999;
    const distB = b._distanceKm !== null ? b._distanceKm : 999;
    if (Math.abs(distA - distB) > 5) {
      return distA - distB;
    }
    const aCityMatch = Boolean(userCity && (a.city || '').toLowerCase().includes(userCity));
    const bCityMatch = Boolean(userCity && (b.city || '').toLowerCase().includes(userCity));
    if (aCityMatch && !bCityMatch) return -1;
    if (!aCityMatch && bCityMatch) return 1;

    // 2. Orario della partita più vicino e più urgente
    const aKickoff = getMatchRemainingMs(a);
    const bKickoff = getMatchRemainingMs(b);
    if (Math.abs(aKickoff - bKickoff) > 60000) {
      return aKickoff - bKickoff;
    }

    // 3. Orario di chiusura della candidatura
    const aDead = getMatchDeadlineRemainingMs(a);
    const bDead = getMatchDeadlineRemainingMs(b);
    if (Math.abs(aDead - bDead) > 60000) {
      return aDead - bDead;
    }

    // 4. Persone mancanti (1 giocatore mancante = emergenza più urgente!)
    const aMissing = a.missing_count || 1;
    const bMissing = b.missing_count || 1;
    return aMissing - bMissing;
  });

  container.innerHTML = sortedMatches.map(m => {
    // Official real-world time expiration
    const isTimeEnded = isMatchFinished(m.match_date, m.end_time || m.match_time);
    const isFull = m.status === 'filled' || m.missing_count === 0;
    const isUrgent = !isFull && !isTimeEnded && (m.title.toLowerCase().includes('emergenza') || (m.roles_needed || []).includes('Portiere'));
    
    // Deadline check
    let isDeadlinePassed = false;
    if (m.deadline_time && m.match_date) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (m.match_date === todayStr) {
        const nowTime = new Date().toTimeString().slice(0, 5);
        if (nowTime > m.deadline_time) isDeadlinePassed = true;
      } else if (m.match_date < todayStr) {
        isDeadlinePassed = true;
      }
    }

    const isCreator = isMatchCreator(m);

    const isCityMatch = userCity && (m.city || '').toLowerCase().includes(userCity);

    const rolesPills = (m.roles_needed || []).map(r => {
      let colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      if (r === "Portiere") colorClass = "bg-amber-400 text-slate-950 font-black border-amber-300 animate-pulse";
      else if (r === "Difensore") colorClass = "bg-blue-500/20 text-blue-300 border-blue-500/40";
      else if (r === "Attaccante") colorClass = "bg-rose-500/20 text-rose-300 border-rose-500/40";
      return `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${colorClass}">${r}</span>`;
    }).join(' ');

    const mapsUrl = m.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.field_name + ' ' + m.address + ' ' + m.city)}`;

    return `
      <div class="glass-panel rounded-3xl border ${isCityMatch ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : (isUrgent ? 'border-amber-500/60 shadow-amber-500/10' : (isTimeEnded ? 'border-slate-800/80 opacity-90' : 'border-slate-800'))} p-5 sm:p-6 shadow-xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group">
        <div>
          <!-- Header Badges: Centered on mobile -->
          <div class="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-3 text-center">
            <div class="flex items-center justify-center gap-1.5 flex-wrap">
              <span class="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-black text-white flex items-center gap-1">
                ⚽ Campo a ${m.format}
              </span>
              ${m._distanceKm !== null ? `
                <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <i data-lucide="navigation" class="w-3 h-3 text-emerald-400"></i>
                  📍 ${m._distanceKm} km da te (${m.city})
                </span>
              ` : (isCityMatch ? `
                <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-[10px] border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  <i data-lucide="map-pin" class="w-3 h-3 text-emerald-400"></i>
                  📍 Nella tua città (${m.city})
                </span>
              ` : '')}
              ${isUrgent ? `
                <span class="px-2 py-0.5 rounded-lg bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  SOS URGENTE
                </span>
              ` : (isTimeEnded ? `
                <span class="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                  <i data-lucide="check-check" class="w-3 h-3 text-amber-400"></i>
                  Conclusa
                </span>
              ` : (isFull ? `
                <span class="px-2 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Slot Completi
                </span>
              ` : `
                <span class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 text-[10px] font-bold">
                  ${m.match_date}
                </span>
              `))}
            </div>

            <span class="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 border border-amber-300 shadow">
              ${m.price_per_player}
            </span>
          </div>

          <!-- Title: Centered on mobile -->
          <h3 class="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug text-center sm:text-left">
            ${m.title}
          </h3>

          <!-- Details Grid: 4 Centered Tiles -->
          <div class="mt-3.5 grid grid-cols-2 gap-2 text-center">
            <div class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-emerald-400"></i> Campo
              </span>
              <span class="text-xs font-black text-white truncate max-w-full" title="${m.field_name}, ${m.address}">${m.field_name}</span>
            </div>
            <div class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <i data-lucide="clock" class="w-3 h-3 text-emerald-400"></i> Orario
              </span>
              <span class="text-xs font-black text-emerald-300">Ore ${m.match_time}${m.end_time ? ' - ' + m.end_time : ''}</span>
            </div>
            <div class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <i data-lucide="users" class="w-3 h-3 text-cyan-400"></i> Formato
              </span>
              <span class="text-xs font-black text-white">${m.format} vs ${m.format}</span>
            </div>
            <div class="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center">
              <span class="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-0.5">
                <i data-lucide="shield-check" class="w-3 h-3 text-amber-400"></i> Livello
              </span>
              <span class="text-xs font-black text-white">${m.level}</span>
            </div>
          </div>

          <!-- Centered Status Banner -->
          <div class="mt-3 p-2.5 rounded-2xl ${isFull ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/50 text-rose-300'} text-center shadow-inner flex items-center justify-center gap-2">
            ${isFull ? `
              <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
              <span class="text-xs font-black uppercase font-space">Partita al Completo!</span>
            ` : `
              <span class="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
              <span class="text-xs font-black uppercase font-space tracking-wide">
                ${m.missing_count === 1 ? 'Manca solo 1 Uomo per giocare!' : `Mancano ${m.missing_count} Uomini per giocare!`}
              </span>
            `}
          </div>

          <!-- Location & Map link (Centered) -->
          <div class="mt-2.5 text-center">
            <a href="${mapsUrl}" target="_blank" class="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition">
              <i data-lucide="navigation" class="w-3.5 h-3.5"></i>
              <span>${m.address} (${m.city}) • Apri Mappa</span>
            </a>
          </div>

          <!-- Deadline info (Centered) -->
          ${m.deadline_time ? `
            <div class="mt-2 text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${isDeadlinePassed ? 'text-rose-400' : 'text-amber-300'}">
              <i data-lucide="hourglass" class="w-3.5 h-3.5"></i>
              <span>${isDeadlinePassed ? `Candidature chiuse alle ore ${m.deadline_time}` : `Candidature aperte fino alle ore ${m.deadline_time}`}</span>
            </div>
          ` : ''}

          <!-- Organizer Box (Centered on mobile) -->
          <div class="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 text-center">
            <span class="text-slate-300">Organizzatore: <strong class="text-white font-bold">${m.organizer_name}</strong></span>
            ${(() => {
              const hasApplied = Boolean(
                m.user_application_status === 'pending' || 
                m.user_application_status === 'accepted' || 
                (m.user_applied_roles && m.user_applied_roles.length > 0)
              );
              if (isCreator) {
                return `<span class="text-emerald-400 font-mono font-bold text-xs">📞 ${m.organizer_phone} (Tu)</span>`;
              } else if (hasApplied) {
                return `
                  <button type="button" onclick="openOrganizerWhatsAppDirect(${m.id})" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition active:scale-95 shadow-sm" title="Clicca per aprire WhatsApp con l'organizzatore">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>💬 ${m.organizer_phone}</span>
                  </button>
                `;
              } else {
                return `
                  <button type="button" onclick="handlePhoneClickBeforeApply(${m.id})" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-mono font-semibold transition active:scale-95" title="Invia prima la candidatura per contattare su WhatsApp">
                    <i data-lucide="lock" class="w-3 h-3 text-amber-400"></i>
                    <span>🔒 ${m.organizer_phone}</span>
                  </button>
                `;
              }
            })()}
          </div>

          <!-- Roles: Centered Pills -->
          <div class="mt-3 flex items-center justify-center gap-1.5 flex-wrap text-center">
            <span class="text-[11px] font-black uppercase text-slate-400 mr-0.5">Ruoli cercati:</span>
            ${rolesPills}
          </div>

          ${m.notes ? `
            <p class="mt-2.5 text-xs text-slate-300 italic line-clamp-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
              "${m.notes}"
            </p>
          ` : ''}
        </div>

        <!-- Action Footer -->
        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <button onclick="openPitchModal(${m.id})" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center gap-1.5 transition">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-emerald-400"></i>
            Campetto
          </button>

          <button onclick="shareMatchWhatsApp(${m.id})" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-green-400 transition" title="Condividi su WhatsApp">
            <i data-lucide="share-2" class="w-4 h-4"></i>
          </button>

          ${(() => {
            // 1. Strictly check real-world official clock time: only then can post-match review happen!
            if (isTimeEnded) {
              if (isCreator) {
                return `
                  <button onclick="openReviewModalForMatch(${m.id})" class="btn-shimmer flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition">
                    <i data-lucide="star" class="w-4 h-4 fill-slate-950"></i>
                    Valuta Giocatori
                  </button>
                `;
              } else {
                return `
                  <div class="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5">
                    <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                    Partita Conclusa
                  </div>
                `;
              }
            }

            // 2. If the user is the match creator: show buttons to manage, edit and delete match
            if (isCreator) {
              return `
                <div class="flex items-center gap-1.5 flex-1">
                  <button onclick="openMatchApplicationsModal(${m.id})" class="btn-shimmer flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-black text-xs flex items-center justify-center gap-1.5 shadow transition">
                    <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
                    Candidati (${m.applications_count || 0})
                  </button>
                  <button onclick="startEditMatch(${m.id})" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition" title="Modifica orario e dettagli partita">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                  </button>
                  <button onclick="deleteMyMatch(${m.id})" class="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition" title="Elimina / Cancella Partita">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              `;
            }

            // 3. User is a player: show their status
            const appStatus = m.user_application_status;
            if (appStatus === 'accepted') {
              return `
                <div class="flex-1 py-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-black text-xs flex items-center justify-center gap-1.5">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i>
                  Confermato in Squadra!
                </div>
              `;
            } else if (appStatus === 'pending') {
              const canCancel = !isDeadlinePassed;
              return `
                <div class="flex-1 flex items-center gap-1.5">
                  <button onclick="applyToMatch(${m.id})" class="flex-1 py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition" title="Scrivi all'organizzatore">
                    <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400"></i>
                    Inviata
                  </button>
                  ${canCancel ? `
                    <button onclick="cancelMatchApplication(${m.id})" class="py-2 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition" title="Annulla candidatura prima della scadenza">
                      Annulla
                    </button>
                  ` : ''}
                </div>
              `;
            } else if (appStatus === 'expired') {
              return `
                <div class="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5" title="Candidatura scaduta perché sei stato confermato per un'altra partita">
                  <i data-lucide="clock-alert" class="w-3.5 h-3.5 text-slate-500"></i>
                  Candidatura Scaduta
                </div>
              `;
            } else if (appStatus === 'declined') {
              return `
                <div class="flex-1 py-2 px-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5">
                  <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-400"></i>
                  Non Accettata
                </div>
              `;
            }

            // 4. Match full or deadline passed
            if (isFull) {
              return `
                <div class="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
                  Slot Completi
                </div>
              `;
            }

            if (isDeadlinePassed) {
              return `
                <div class="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5">
                  <i data-lucide="timer-off" class="w-3.5 h-3.5 text-rose-400"></i>
                  Candidature Chiuse
                </div>
              `;
            }

            // 5. Open to apply!
            return `
              <button onclick="applyToMatch(${m.id})" class="btn-shimmer flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition">
                <i data-lucide="hand" class="w-4 h-4"></i>
                Mi Candido!
              </button>
            `;
          })()}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function isMatchFinished(dateStr, timeStr) {
  if (!dateStr) return false;
  try {
    const time = (timeStr && timeStr.trim()) ? timeStr.trim() : '23:59';
    const matchDateTime = new Date(`${dateStr}T${time}:00`);
    return new Date() >= matchDateTime;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------
// CREATOR APPLICATION MANAGEMENT MODAL
// ----------------------------------------------------
let currentManagingMatchId = null;

async function openMatchApplicationsModal(matchId) {
  SoundFX.playClick();
  currentManagingMatchId = matchId;
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;

  document.getElementById('appModalMatchTitle').innerText = `${match.title} (${match.field_name})`;
  document.getElementById('appModalSlotsStatus').innerText = match.missing_count === 0 ? 'Tutti gli slot occupati' : `Mancano ${match.missing_count} giocatori`;

  const listContainer = document.getElementById('matchApplicationsList');
  listContainer.innerHTML = `
    <div class="text-center py-8 text-slate-400 text-xs">
      <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2"></i>
      Caricamento candidature...
    </div>
  `;
  lucide.createIcons();

  document.getElementById('matchApplicationsModal').classList.remove('hidden');
  document.getElementById('matchApplicationsModal').classList.add('flex');

  try {
    const res = await fetch(`/api/matches/${matchId}/applications`);
    const data = await res.json();
    const apps = data.applications || [];

    if (!apps.length) {
      listContainer.innerHTML = `
        <div class="text-center py-10 glass-panel rounded-2xl border border-slate-800">
          <i data-lucide="user-x" class="w-8 h-8 text-slate-500 mx-auto mb-2"></i>
          <p class="text-sm font-bold text-white">Nessuna candidatura ancora ricevuta</p>
          <p class="text-xs text-slate-400 mt-1">Non appena un giocatore clicca "Mi Candido", lo vedrai qui e potrai confermarlo con un click!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    listContainer.innerHTML = apps.map(app => {
      const isPending = app.status === 'pending';
      const isAccepted = app.status === 'accepted';
      const isDeclined = app.status === 'declined';
      const isExpired = app.status === 'expired';

      const phoneClean = (app.player_phone || '').replace(/[^0-9]/g, '');
      const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Ciao ${app.player_name}! Ti contatto da 'Trova l'Ultimo' per la partita '${match.title}'.`)}` : '#';

      return `
        <div class="p-4 rounded-2xl bg-slate-900/90 border ${isAccepted ? 'border-emerald-500/50 bg-emerald-950/20' : (isPending ? 'border-amber-500/40' : 'border-slate-800')} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="${app.photo_url || '/static/avatars/bomber.svg'}" class="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-700 object-contain p-1 flex-shrink-0">
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-white">${app.player_name}</h4>
                <span class="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">OVR ${app.player_ovr}</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">${app.player_role}</span>
              </div>
              <p class="text-xs text-slate-300 italic mt-0.5">"${app.message || 'Pronto a giocare!'}"</p>
              <div class="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span>⭐ Affidabilità: <strong class="text-emerald-400">${app.reliability_score || 100}%</strong></span>
                <span>•</span>
                <a href="${waUrl}" target="_blank" class="text-green-400 hover:text-green-300 font-bold flex items-center gap-1">
                  <i data-lucide="message-square" class="w-3 h-3"></i>
                  ${app.player_phone || 'WhatsApp'}
                </a>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-center">
            ${isPending ? `
              <button onclick="confirmCandidate(${matchId}, ${app.id})" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                Conferma
              </button>
              <button onclick="declineCandidate(${matchId}, ${app.id})" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 text-slate-300 text-xs font-bold border border-slate-700 transition">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                Rifiuta
              </button>
            ` : (isAccepted ? `
              <span class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                Confermato
              </span>
            ` : (isDeclined ? `
              <span class="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1">
                <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-400"></i>
                Rifiutato
              </span>
            ` : `
              <span class="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1" title="Il giocatore è stato confermato per un'altra partita">
                <i data-lucide="clock-alert" class="w-3.5 h-3.5 text-slate-500"></i>
                Scaduta (Altrove)
              </span>
            `))}
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  } catch (e) {
    listContainer.innerHTML = `<div class="text-center py-6 text-rose-400 text-xs">Errore nel caricamento delle candidature.</div>`;
  }
}

async function confirmCandidate(matchId, applicationId) {
  try {
    const res = await fetch(`/api/matches/${matchId}/confirm_player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Impossibile confermare il giocatore.");
      return;
    }

    SoundFX.playGoalCheer();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

    await fetchMatches();
    await openMatchApplicationsModal(matchId);
  } catch (e) {
    alert("Errore di connessione.");
  }
}

async function declineCandidate(matchId, applicationId) {
  try {
    const res = await fetch(`/api/matches/${matchId}/decline_player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId })
    });
    await fetchMatches();
    await openMatchApplicationsModal(matchId);
  } catch (e) {
    alert("Errore di connessione.");
  }
}

function closeMatchApplicationsModal() {
  SoundFX.playClick();
  document.getElementById('matchApplicationsModal').classList.add('hidden');
  document.getElementById('matchApplicationsModal').classList.remove('flex');
}

function openReviewModalForMatch(matchId) {
  SoundFX.playClick();
  requireAuthAndExecute(() => {
    // 1. Check if there is an item in pendingReviews
    const pending = (state.pendingReviews || []).find(r => r.match_id === matchId);
    if (pending) {
      openFeedbackModalForPlayer(pending);
      return;
    }

    // 2. Otherwise find the match and take the confirmed joined player
    const match = state.matches.find(m => m.id === matchId);
    if (match) {
      let players = [];
      try {
        players = typeof match.confirmed_players === 'string' ? JSON.parse(match.confirmed_players) : (match.confirmed_players || []);
      } catch (e) {
        players = [];
      }
      
      const joined = players.find(p => p.player_id && p.player_id !== match.creator_id) || players[players.length - 1];
      if (joined) {
        openFeedbackModalForPlayer({
          match_id: match.id,
          match_title: match.title,
          match_date: match.match_date,
          match_time: match.match_time,
          end_time: match.end_time || '',
          target_player_id: joined.player_id || `player_${joined.name.toLowerCase().replace(/\s+/g, '_')}`,
          target_player_name: joined.name,
          target_player_role: joined.role || 'Giocatore',
          target_player_ovr: joined.ovr || 80
        });
        return;
      }
    }
    alert("Nessun giocatore unito da valutare per questa partita.");
  });
}

function setFilterFormat(fmt) {
  SoundFX.playClick();
  state.filters.format = fmt;
  document.querySelectorAll('.fmt-btn').forEach(btn => {
    btn.classList.remove('bg-emerald-500', 'text-slate-950', 'active');
    btn.classList.add('text-slate-300');
  });
  const el = document.getElementById(`fmt-${fmt}`);
  if (el) {
    el.classList.add('bg-emerald-500', 'text-slate-950', 'active');
    el.classList.remove('text-slate-300');
  }
  fetchMatches();
}

function setFilterRole(role) {
  SoundFX.playClick();
  state.filters.role = role;
  document.querySelectorAll('.role-pill').forEach(btn => {
    btn.classList.remove('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-300', 'active');
    btn.classList.add('border-slate-700', 'text-slate-200');
  });
  const el = document.getElementById(`role-${role}`);
  if (el) {
    el.classList.add('bg-emerald-500/20', 'border-emerald-500', 'text-emerald-300', 'active');
    el.classList.remove('border-slate-700', 'text-slate-200');
  }
  fetchMatches();
}

function onSearchChange() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.filters.search = document.getElementById('searchInput').value.trim();
    fetchMatches();
  }, 250);
}

function updateLiveTicker() {
  const ticker = document.getElementById('urgentTickerText');
  const countBadge = document.getElementById('openMatchesCountBadge');
  const activeMatches = (state.matches || []).filter(m => {
    if (isMatchFinished(m.match_date, m.end_time || m.match_time)) return false;
    const missing = typeof m.missing_count === 'number' ? m.missing_count : parseInt(m.missing_count || 0, 10);
    return missing > 0 && m.status !== 'filled' && m.status !== 'completed';
  });
  if (countBadge) countBadge.innerText = `⚽ ${activeMatches.length} Partite Aperte`;
  if (ticker && activeMatches.length > 0) {
    const firstUrgent = activeMatches.find(m => (m.roles_needed || []).includes("Portiere")) || activeMatches[0];
    ticker.innerText = `Mai più con uno in meno: ${firstUrgent.title} (${firstUrgent.city} ore ${firstUrgent.match_time}) - Manca l'ultimo!`;
  }
}

// ----------------------------------------------------
// TACTICAL PITCH MODAL
// ----------------------------------------------------
function openPitchModal(matchId) {
  SoundFX.playClick();
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;

  state.activeMatchForPitch = match;
  renderPitch(match);

  const modal = document.getElementById('pitchModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const scrollBox = modal.querySelector('.overflow-y-auto');
    if (scrollBox) scrollBox.scrollTop = 0;
  }
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function closePitchModal() {
  SoundFX.playClick();
  const modal = document.getElementById('pitchModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.classList.remove('overflow-hidden');
}

function renderPitch(match) {
  state.activeMatchForPitch = match;
  const layer = document.getElementById('pitchPlayersLayer');
  layer.innerHTML = '';

  const format = parseInt(match.format) || 5;

  // Real-world timing and status checks
  const isTimeEnded = isMatchFinished(match.match_date, match.end_time || match.match_time);
  const isFull = match.status === 'filled' || match.missing_count === 0;

  // Deadline calculation
  let isDeadlinePassed = false;
  if (match.deadline_time && match.match_date) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (match.match_date === todayStr) {
      const nowTime = new Date().toTimeString().slice(0, 5);
      if (nowTime > match.deadline_time) isDeadlinePassed = true;
    } else if (match.match_date < todayStr) {
      isDeadlinePassed = true;
    }
  }

  const appliedStatus = match.user_application_status;
  const isCreator = isMatchCreator(match);

  // 1. Modulo labels & Double Pitch Detection
  let moduloText = "2-1-1 + Portiere";
  if (format === 6) moduloText = "2-2-1 + Portiere";
  else if (format === 7) moduloText = "2-2-2 + Portiere";

  const rawMissing = parseInt(match.missing_count) || 1;
  const isDoublePitch = Boolean(rawMissing > format || (match.confirmed_players && match.confirmed_players.length >= format));

  document.getElementById('pitchModalTitle').innerText = match.title;
  document.getElementById('pitchModalSubtitle').innerText = `${match.field_name}, ${match.address} (${match.city}) • Inizio ore ${match.match_time}`;
  if (isDoublePitch) {
    document.getElementById('pitchModalFormatBadge').innerText = `CALCIO A ${format} • DOPPIO CAMPO (${format * 2} GIOCATORI)`;
  } else {
    document.getElementById('pitchModalFormatBadge').innerText = `CALCIO A ${format} (${moduloText})`;
  }
  document.getElementById('pitchModalPrice').innerText = `Quota: ${match.price_per_player}`;

  // Populate Organizer Direct Contact Box in pitch modal
  const orgNameEl = document.getElementById('pitchModalOrganizerName');
  if (orgNameEl) orgNameEl.innerText = match.organizer_name || 'Organizzatore';

  const orgPhoneBox = document.getElementById('pitchModalOrganizerPhoneContainer');
  if (orgPhoneBox) {
    const hasApplied = Boolean(
      appliedStatus === 'pending' || 
      appliedStatus === 'accepted' || 
      (match.user_applied_roles && match.user_applied_roles.length > 0)
    );
    if (isCreator) {
      orgPhoneBox.innerHTML = `<span class="text-emerald-400 font-mono font-bold text-xs">📞 ${match.organizer_phone || ''} (Tu)</span>`;
    } else if (hasApplied) {
      orgPhoneBox.innerHTML = `
        <button type="button" onclick="openOrganizerWhatsAppDirect(${match.id})" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold transition active:scale-95 shadow-sm" title="Clicca per aprire WhatsApp con l'organizzatore">
          <i data-lucide="message-circle" class="w-3.5 h-3.5 text-emerald-400"></i>
          <span>💬 ${match.organizer_phone || ''}</span>
        </button>
      `;
    } else {
      orgPhoneBox.innerHTML = `
        <button type="button" onclick="handlePhoneClickBeforeApply(${match.id})" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 text-xs font-mono font-semibold transition active:scale-95" title="Invia la candidatura per contattare su WhatsApp">
          <i data-lucide="lock" class="w-3 h-3 text-amber-400"></i>
          <span>🔒 ${match.organizer_phone || ''}</span>
        </button>
      `;
    }
  }

  // 2. Status Badge in header
  const statusBadge = document.getElementById('pitchModalStatusBadge');
  if (isCreator) {
    statusBadge.className = "bg-cyan-500/20 text-cyan-300 text-xs font-black px-2 py-0.5 rounded border border-cyan-500/40";
    statusBadge.innerText = "TUA PARTITA (ORGANIZZATORE)";
  } else if (isTimeEnded) {
    statusBadge.className = "bg-slate-800 text-amber-300 text-xs font-black px-2 py-0.5 rounded border border-amber-400/40";
    statusBadge.innerText = "PARTITA CONCLUSA";
  } else if (isFull) {
    statusBadge.className = "bg-emerald-950 text-emerald-300 text-xs font-black px-2 py-0.5 rounded border border-emerald-500/40";
    statusBadge.innerText = "SQUADRA AL COMPLETO";
  } else if (isDeadlinePassed) {
    statusBadge.className = "bg-rose-950 text-rose-300 text-xs font-black px-2 py-0.5 rounded border border-rose-500/40";
    statusBadge.innerText = "CANDIDATURE CHIUSE";
  } else if (appliedStatus === 'pending') {
    statusBadge.className = "bg-amber-500/20 text-amber-300 text-xs font-black px-2 py-0.5 rounded border border-amber-500/40";
    statusBadge.innerText = "CANDIDATURA INVIATA";
  } else if (appliedStatus === 'accepted') {
    statusBadge.className = "bg-emerald-500/20 text-emerald-300 text-xs font-black px-2 py-0.5 rounded border border-emerald-500/40";
    statusBadge.innerText = "SEI IN SQUADRA";
  } else {
    statusBadge.className = "bg-rose-500/20 text-rose-300 text-xs font-black px-2 py-0.5 rounded border border-rose-500/40";
    statusBadge.innerText = match.missing_count === 1 ? "MANCA 1 ULTIMO" : `MANCANO ${match.missing_count} GIOCATORI`;
  }

  // 3. Deadline Banner
  const deadlineBanner = document.getElementById('pitchModalDeadlineBanner');
  const deadlineText = document.getElementById('pitchModalDeadlineText');
  const deadlineTag = document.getElementById('pitchModalDeadlineTag');

  if (match.deadline_time) {
    if (isDeadlinePassed) {
      deadlineBanner.className = "w-full max-w-2xl px-4 py-2.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-300 flex items-center justify-between text-xs font-bold shadow-inner mb-3";
      deadlineText.innerText = `Tempo massimo per candidarsi SCADUTO (era alle ore ${match.deadline_time})`;
      deadlineTag.innerText = "SCADUTO";
      deadlineTag.className = "text-[10px] px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono";
    } else {
      deadlineBanner.className = "w-full max-w-2xl px-4 py-2.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs font-bold shadow-inner mb-3";
      deadlineText.innerText = `Tempo massimo per candidarsi: Entro le ore ${match.deadline_time}`;
      deadlineTag.innerText = "ORARIO LIMITE";
      deadlineTag.className = "text-[10px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono";
    }
  } else {
    deadlineBanner.className = "w-full max-w-2xl px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between text-xs font-bold shadow-inner mb-3";
    deadlineText.innerText = `Candidature aperte fino all'inizio della partita (ore ${match.match_time})`;
    deadlineTag.innerText = "IN CORSO";
    deadlineTag.className = "text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono";
  }

  // 4. Instruction text above pitch
  const instructionEl = document.getElementById('pitchModalInstructionText');
  if (isCreator) {
    instructionEl.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-cyan-400"></i> Sei l'organizzatore: visualizza la disposizione tattica e gestisci i candidati ricevuti!`;
    instructionEl.className = "text-xs text-cyan-300 font-bold mb-3 flex items-center gap-1.5";
  } else if (isTimeEnded) {
    instructionEl.innerHTML = `<i data-lucide="info" class="w-4 h-4"></i> Partita conclusa all'orario ufficiale.`;
    instructionEl.className = "text-xs text-slate-400 font-bold mb-3 flex items-center gap-1.5";
  } else if (isFull) {
    instructionEl.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Tutti gli slot sono stati completati! Non è più possibile candidarsi.`;
    instructionEl.className = "text-xs text-emerald-400 font-bold mb-3 flex items-center gap-1.5";
  } else if (isDeadlinePassed) {
    instructionEl.innerHTML = `<i data-lucide="timer-off" class="w-4 h-4 text-rose-400"></i> Orario limite superato: le candidature per questa partita sono chiuse.`;
    instructionEl.className = "text-xs text-rose-400 font-bold mb-3 flex items-center gap-1.5";
  } else if (appliedStatus === 'pending') {
    instructionEl.innerHTML = `<i data-lucide="clock" class="w-4 h-4 text-amber-400"></i> Ti sei già candidato per questa partita! L'organizzatore deve confermarti.`;
    instructionEl.className = "text-xs text-amber-300 font-bold mb-3 flex items-center gap-1.5";
  } else if (appliedStatus === 'accepted') {
    instructionEl.innerHTML = `<i data-lucide="check-check" class="w-4 h-4 text-emerald-400"></i> Sei stato CONFERMATO ufficialmente in squadra dall'organizzatore!`;
    instructionEl.className = "text-xs text-emerald-300 font-bold mb-3 flex items-center gap-1.5";
  } else {
    instructionEl.innerHTML = `<i data-lucide="mouse-pointer-click" class="w-4 h-4"></i> Clicca sullo slot rosso lampeggiante con il "+" per candidarti in quel ruolo!`;
    instructionEl.className = "text-xs text-rose-300 font-black mb-3 flex items-center gap-1.5 animate-pulse";
  }

  // 5. Tactical Pitch Board Sizing & Dynamic Field Lines Layer
  const boardEl = document.getElementById('tacticalPitchBoard');
  const linesLayer = document.getElementById('pitchLinesLayer');
  if (boardEl) {
    if (isDoublePitch) {
      boardEl.style.height = window.innerWidth < 640 ? '580px' : '650px';
    } else {
      boardEl.style.height = '';
    }
  }

  if (linesLayer) {
    if (isDoublePitch) {
      linesLayer.innerHTML = `
        <!-- Full Pitch Outer Boundary -->
        <div class="absolute inset-3 border-2 border-white/40 rounded-2xl pointer-events-none"></div>
        <!-- Halfway line -->
        <div class="absolute top-1/2 left-3 right-3 h-[2px] bg-white/40 -translate-y-1/2 pointer-events-none"></div>
        <!-- Center circle -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/40 pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/70 pointer-events-none"></div>
        <!-- Top Goal Area (Squadra B) -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[22%] h-[10px] bg-white/25 border-b border-x border-white/80 rounded-b pointer-events-none"></div>
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-[52%] sm:w-[48%] h-[14%] border-b-2 border-x-2 border-white/40 rounded-b-xl pointer-events-none"></div>
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-[28%] sm:w-[24%] h-[6%] border-b-2 border-x-2 border-white/30 rounded-b-lg pointer-events-none"></div>
        <div class="absolute top-[10%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60 pointer-events-none"></div>
        <!-- Bottom Goal Area (Squadra A) -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[22%] h-[10px] bg-white/25 border-t border-x border-white/80 rounded-t pointer-events-none"></div>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-[52%] sm:w-[48%] h-[14%] border-t-2 border-x-2 border-white/40 rounded-t-xl pointer-events-none"></div>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-[28%] sm:w-[24%] h-[6%] border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none"></div>
        <div class="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/60 pointer-events-none"></div>
        <!-- Corner Arcs -->
        <div class="absolute top-3 left-3 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-full pointer-events-none"></div>
        <div class="absolute top-3 right-3 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-full pointer-events-none"></div>
        <div class="absolute bottom-3 left-3 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-full pointer-events-none"></div>
        <div class="absolute bottom-3 right-3 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-full pointer-events-none"></div>
        <!-- Team Labels -->
        <div class="absolute top-4 right-5 text-[10px] font-black uppercase tracking-wider text-sky-300/70 bg-sky-950/70 px-2 py-0.5 rounded border border-sky-500/30 pointer-events-none">
          Squadra B (Ospiti)
        </div>
        <div class="absolute bottom-4 right-5 text-[10px] font-black uppercase tracking-wider text-emerald-300/70 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30 pointer-events-none">
          Squadra A (Casa)
        </div>
      `;
    } else {
      linesLayer.innerHTML = `
        <!-- Single Pitch Half-Court Lines -->
        <div class="absolute inset-3 border-2 border-white/40 rounded-2xl pointer-events-none"></div>
        <!-- Top Halfway line -->
        <div class="absolute top-3 left-3 right-3 h-[2px] bg-white/40 pointer-events-none"></div>
        <!-- Top Center circle arc -->
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-14 rounded-b-full border-b-2 border-x-2 border-white/40 pointer-events-none"></div>
        <div class="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/70 -translate-y-1/2 pointer-events-none"></div>
        <!-- Bottom Goal Area -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[24%] h-[10px] bg-white/25 border-t border-x border-white/80 rounded-t pointer-events-none"></div>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-[58%] sm:w-[54%] h-[24%] border-t-2 border-x-2 border-white/40 rounded-t-2xl pointer-events-none"></div>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 w-[32%] sm:w-[28%] h-[11%] border-t-2 border-x-2 border-white/30 rounded-t-xl pointer-events-none"></div>
        <div class="absolute bottom-[17%] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/70 pointer-events-none"></div>
        <div class="absolute bottom-[24%] left-1/2 -translate-x-1/2 w-24 h-12 rounded-t-full border-t-2 border-x-2 border-white/30 pointer-events-none"></div>
        <!-- Bottom Corner Arcs -->
        <div class="absolute bottom-3 left-3 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-full pointer-events-none"></div>
        <div class="absolute bottom-3 right-3 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-full pointer-events-none"></div>
        <!-- Half Pitch Watermark -->
        <div class="absolute top-5 left-5 text-[9px] font-black uppercase tracking-widest text-emerald-300/40 pointer-events-none">
          Metà Campo Tattica
        </div>
      `;
    }
  }

  // 5b. Tactical Formations Configuration
  let slots = [];
  if (isDoublePitch) {
    // DOPPIO CAMPO: 2 Squadre (Squadra A Casa in basso + Squadra B Ospiti in alto)
    if (format === 5) {
      slots = [
        // Squadra A (Casa) - Bottom half
        { id: 'pt_a', l: 50, t: 92, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere (A)', team: 'A' },
        { id: 'dif_sx_a', l: 30, t: 80, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX (A)', team: 'A' },
        { id: 'dif_dx_a', l: 70, t: 80, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX (A)', team: 'A' },
        { id: 'cen_a', l: 50, t: 66, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista (A)', team: 'A' },
        { id: 'att_a', l: 50, t: 55, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante (A)', team: 'A' },
        // Squadra B (Ospiti) - Top half
        { id: 'att_b', l: 50, t: 45, role: 'Attaccante', shortRole: 'ATT', num: 11, name: 'Attaccante (B)', team: 'B' },
        { id: 'cen_b', l: 50, t: 34, role: 'Centrocampista', shortRole: 'CEN', num: 10, name: 'Centrocampista (B)', team: 'B' },
        { id: 'dif_sx_b', l: 30, t: 20, role: 'Difensore', shortRole: 'DIF', num: 4, name: 'Difensore SX (B)', team: 'B' },
        { id: 'dif_dx_b', l: 70, t: 20, role: 'Difensore', shortRole: 'DIF', num: 5, name: 'Difensore DX (B)', team: 'B' },
        { id: 'pt_b', l: 50, t: 8, role: 'Portiere', shortRole: 'PT', num: 12, name: 'Portiere (B)', team: 'B' }
      ];
    } else if (format === 6) {
      slots = [
        // Squadra A (Casa)
        { id: 'pt_a', l: 50, t: 92, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere (A)', team: 'A' },
        { id: 'dif_sx_a', l: 30, t: 80, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX (A)', team: 'A' },
        { id: 'dif_dx_a', l: 70, t: 80, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX (A)', team: 'A' },
        { id: 'cen_sx_a', l: 32, t: 66, role: 'Centrocampista', shortRole: 'CEN', num: 6, name: 'Centrocampista SX (A)', team: 'A' },
        { id: 'cen_dx_a', l: 68, t: 66, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista DX (A)', team: 'A' },
        { id: 'att_a', l: 50, t: 55, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante (A)', team: 'A' },
        // Squadra B (Ospiti)
        { id: 'att_b', l: 50, t: 45, role: 'Attaccante', shortRole: 'ATT', num: 11, name: 'Attaccante (B)', team: 'B' },
        { id: 'cen_sx_b', l: 32, t: 34, role: 'Centrocampista', shortRole: 'CEN', num: 7, name: 'Centrocampista SX (B)', team: 'B' },
        { id: 'cen_dx_b', l: 68, t: 34, role: 'Centrocampista', shortRole: 'CEN', num: 10, name: 'Centrocampista DX (B)', team: 'B' },
        { id: 'dif_sx_b', l: 30, t: 20, role: 'Difensore', shortRole: 'DIF', num: 4, name: 'Difensore SX (B)', team: 'B' },
        { id: 'dif_dx_b', l: 70, t: 20, role: 'Difensore', shortRole: 'DIF', num: 5, name: 'Difensore DX (B)', team: 'B' },
        { id: 'pt_b', l: 50, t: 8, role: 'Portiere', shortRole: 'PT', num: 12, name: 'Portiere (B)', team: 'B' }
      ];
    } else {
      slots = [
        // Squadra A (Casa)
        { id: 'pt_a', l: 50, t: 92, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere (A)', team: 'A' },
        { id: 'dif_sx_a', l: 30, t: 80, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX (A)', team: 'A' },
        { id: 'dif_dx_a', l: 70, t: 80, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX (A)', team: 'A' },
        { id: 'cen_sx_a', l: 32, t: 66, role: 'Centrocampista', shortRole: 'CEN', num: 4, name: 'Centrocampista SX (A)', team: 'A' },
        { id: 'cen_dx_a', l: 68, t: 66, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista DX (A)', team: 'A' },
        { id: 'att_sx_a', l: 35, t: 55, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante SX (A)', team: 'A' },
        { id: 'att_dx_a', l: 65, t: 55, role: 'Attaccante', shortRole: 'ATT', num: 11, name: 'Attaccante DX (A)', team: 'A' },
        // Squadra B (Ospiti)
        { id: 'att_sx_b', l: 35, t: 45, role: 'Attaccante', shortRole: 'ATT', num: 13, name: 'Attaccante SX (B)', team: 'B' },
        { id: 'att_dx_b', l: 65, t: 45, role: 'Attaccante', shortRole: 'ATT', num: 14, name: 'Attaccante DX (B)', team: 'B' },
        { id: 'cen_sx_b', l: 32, t: 34, role: 'Centrocampista', shortRole: 'CEN', num: 7, name: 'Centrocampista SX (B)', team: 'B' },
        { id: 'cen_dx_b', l: 68, t: 34, role: 'Centrocampista', shortRole: 'CEN', num: 10, name: 'Centrocampista DX (B)', team: 'B' },
        { id: 'dif_sx_b', l: 30, t: 20, role: 'Difensore', shortRole: 'DIF', num: 5, name: 'Difensore SX (B)', team: 'B' },
        { id: 'dif_dx_b', l: 70, t: 20, role: 'Difensore', shortRole: 'DIF', num: 6, name: 'Difensore DX (B)', team: 'B' },
        { id: 'pt_b', l: 50, t: 8, role: 'Portiere', shortRole: 'PT', num: 12, name: 'Portiere (B)', team: 'B' }
      ];
    }
  } else {
    // CAMPO SINGOLO / METÀ CAMPO (Squadra A)
    if (format === 5) {
      slots = [
        { id: 'pt', l: 50, t: 86, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere', team: 'A' },
        { id: 'dif_sx', l: 30, t: 66, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX', team: 'A' },
        { id: 'dif_dx', l: 70, t: 66, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX', team: 'A' },
        { id: 'cen', l: 50, t: 44, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista', team: 'A' },
        { id: 'att', l: 50, t: 18, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante', team: 'A' }
      ];
    } else if (format === 6) {
      slots = [
        { id: 'pt', l: 50, t: 86, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere', team: 'A' },
        { id: 'dif_sx', l: 30, t: 68, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX', team: 'A' },
        { id: 'dif_dx', l: 70, t: 68, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX', team: 'A' },
        { id: 'cen_sx', l: 32, t: 44, role: 'Centrocampista', shortRole: 'CEN', num: 4, name: 'Centrocampista SX', team: 'A' },
        { id: 'cen_dx', l: 68, t: 44, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista DX', team: 'A' },
        { id: 'att', l: 50, t: 18, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante', team: 'A' }
      ];
    } else {
      slots = [
        { id: 'pt', l: 50, t: 86, role: 'Portiere', shortRole: 'PT', num: 1, name: 'Portiere', team: 'A' },
        { id: 'dif_sx', l: 30, t: 68, role: 'Difensore', shortRole: 'DIF', num: 2, name: 'Difensore SX', team: 'A' },
        { id: 'dif_dx', l: 70, t: 68, role: 'Difensore', shortRole: 'DIF', num: 3, name: 'Difensore DX', team: 'A' },
        { id: 'cen_sx', l: 32, t: 44, role: 'Centrocampista', shortRole: 'CEN', num: 4, name: 'Centrocampista SX', team: 'A' },
        { id: 'cen_dx', l: 68, t: 44, role: 'Centrocampista', shortRole: 'CEN', num: 8, name: 'Centrocampista DX', team: 'A' },
        { id: 'att_sx', l: 35, t: 18, role: 'Attaccante', shortRole: 'ATT', num: 9, name: 'Attaccante SX', team: 'A' },
        { id: 'att_dx', l: 65, t: 18, role: 'Attaccante', shortRole: 'ATT', num: 11, name: 'Attaccante DX', team: 'A' }
      ];
    }
  }

  // 5c. Organizer / Captain assignment according to organizer_role
  let captainRole = (match.organizer_role || '').trim();
  if (!captainRole) {
    if (state.profile && state.profile.primary_role) captainRole = state.profile.primary_role;
    else if (state.currentUser && state.currentUser.primary_role) captainRole = state.currentUser.primary_role;
    else captainRole = 'Centrocampista';
  }
  const capLower = captainRole.toLowerCase();
  if (capLower.includes('port')) captainRole = 'Portiere';
  else if (capLower.includes('dif')) captainRole = 'Difensore';
  else if (capLower.includes('att')) captainRole = 'Attaccante';
  else captainRole = 'Centrocampista';

  // Captain is placed in Team A (Casa) matching their chosen role
  const teamASlots = slots.filter(s => s.team === 'A');
  let captainSlot = teamASlots.find(s => s.role === captainRole);
  if (!captainSlot) {
    captainSlot = teamASlots.find(s => s.role === 'Centrocampista') || teamASlots[0];
  }

  captainSlot.isCaptainSlot = true;
  captainSlot.isMissing = false;

  let captainUsername = (match.creator_username || '').trim();
  if (!captainUsername && isCreator && state.currentUser) {
    captainUsername = state.currentUser.username || state.currentUser.full_name || '';
  }
  if (!captainUsername && match.creator_id) {
    captainUsername = match.creator_id.replace('user_', '');
  }
  if (!captainUsername) {
    captainUsername = match.organizer_name || 'Capitano';
  }
  if (!captainUsername.startsWith('@')) {
    captainUsername = `@${captainUsername}`;
  }

  captainSlot.assignedConfirmedPlayer = {
    isCaptain: true,
    player_name: match.organizer_name || 'Organizzatore',
    player_username: captainUsername,
    player_role: captainSlot.role
  };

  // 5d. Confirmed players assignment by their selected / confirmed role
  const confirmedPlayersPool = Array.isArray(match.confirmed_players) ? [...match.confirmed_players] : [];
  
  // Exclude organizer from remaining confirmed players pool
  const orgNameLower = (match.organizer_name || '').toLowerCase();
  const rawCapUser = captainUsername.toLowerCase().replace('@', '');
  const remainingConfirmed = confirmedPlayersPool.filter(p => {
    const pName = (p.player_name || p.name || '').toLowerCase();
    const pUser = (p.player_username || '').toLowerCase().replace('@', '');
    return !pName.includes(orgNameLower) && !pUser.includes(rawCapUser) && !pName.includes('capitano');
  });

  // Assign each confirmed player to an unassigned slot matching their player_role
  remainingConfirmed.forEach(player => {
    const pRoleRaw = (player.player_role || player.role || '').toLowerCase();
    let normRole = 'Centrocampista';
    if (pRoleRaw.includes('port')) normRole = 'Portiere';
    else if (pRoleRaw.includes('dif')) normRole = 'Difensore';
    else if (pRoleRaw.includes('att')) normRole = 'Attaccante';
    else normRole = 'Centrocampista';

    // Try Team A first, then Team B
    let targetSlot = slots.find(s => !s.isCaptainSlot && !s.assignedConfirmedPlayer && s.team === 'A' && s.role === normRole);
    if (!targetSlot) {
      targetSlot = slots.find(s => !s.isCaptainSlot && !s.assignedConfirmedPlayer && s.role === normRole);
    }
    if (!targetSlot) {
      // If all slots of that role are taken, assign to any available slot in Team A then Team B
      targetSlot = slots.find(s => !s.isCaptainSlot && !s.assignedConfirmedPlayer && s.team === 'A');
      if (!targetSlot) {
        targetSlot = slots.find(s => !s.isCaptainSlot && !s.assignedConfirmedPlayer);
      }
    }

    if (targetSlot) {
      let pUser = player.player_username || player.player_name || player.name || 'Giocatore';
      if (!pUser.startsWith('@')) pUser = `@${pUser}`;
      targetSlot.assignedConfirmedPlayer = {
        ...player,
        player_username: pUser,
        player_role: targetSlot.role
      };
      targetSlot.isMissing = false;
    }
  });

  // 6. Identify Missing Slots accurately according to roles_needed and missing_count
  const rolesNeeded = Array.isArray(match.roles_needed) 
    ? match.roles_needed 
    : (typeof match.roles_needed === 'string' ? JSON.parse(match.roles_needed || '[]') : [match.roles_needed]);
  
  // Real missing count: never exceed available unassigned slots, minimum 0 if isFull
  const unassignedSlots = slots.filter(s => !s.assignedConfirmedPlayer);
  const missingCount = isFull ? 0 : Math.min(unassignedSlots.length, Math.max(1, rawMissing));

  // Reset missing state on all slots
  slots.forEach(s => s.isMissing = false);

  if (missingCount > 0) {
    let missingMarked = 0;
    const specificRoles = rolesNeeded.filter(r => {
      const s = (r || '').toLowerCase();
      return !s.includes('jolly') && !s.includes('qualsiasi') && !s.includes('chiunque') && !s.includes('tutti');
    });

    // 1st pass: match specific requested roles first on unassigned slots
    specificRoles.forEach(neededRole => {
      if (missingMarked >= missingCount) return;
      const targetSlot = slots.find(s => !s.assignedConfirmedPlayer && !s.isMissing && s.role.toLowerCase() === (neededRole || '').toLowerCase());
      if (targetSlot) {
        targetSlot.isMissing = true;
        missingMarked++;
      }
    });

    // 2nd pass: if more missing slots needed to reach missingCount
    if (missingMarked < missingCount) {
      const candidateSlots = slots.filter(s => !s.assignedConfirmedPlayer && !s.isMissing);
      // Prioritize Team A first, then Team B, and balanced across roles
      const rolePriority = { 'Attaccante': 1, 'Centrocampista': 2, 'Difensore': 3, 'Portiere': 4 };
      candidateSlots.sort((a, b) => {
        if (a.team === 'A' && b.team !== 'A') return -1;
        if (a.team !== 'A' && b.team === 'A') return 1;
        return (rolePriority[a.role] || 5) - (rolePriority[b.role] || 5);
      });
      for (const slot of candidateSlots) {
        if (missingMarked >= missingCount) break;
        slot.isMissing = true;
        missingMarked++;
      }
    }
  }

  // User applied slots and max applications calculations
  const appliedRoles = (match.user_applied_roles || []);
  const appliedCount = appliedRoles.length;
  const maxApplicationsAllowed = missingCount;
  const hasReachedMaxApplications = appliedCount >= maxApplicationsAllowed;

  const appliedQueue = [...appliedRoles];
  slots.forEach(s => {
    if (s.isMissing) {
      const roleLower = (s.role || '').toLowerCase();
      const idx = appliedQueue.findIndex(r => (r || '').toLowerCase() === roleLower || (r || '').toLowerCase() === 'jolly');
      if (idx !== -1) {
        s.isUserApplied = true;
        s.userAppliedRole = appliedQueue.splice(idx, 1)[0];
      }
    }
  });

  if (appliedQueue.length > 0) {
    slots.forEach(s => {
      if (s.isMissing && !s.isUserApplied && appliedQueue.length > 0) {
        s.isUserApplied = true;
        s.userAppliedRole = appliedQueue.shift();
      }
    });
  }

  // Update dynamic contextual legend
  const legendEl = document.getElementById('pitchModalLegend');
  if (legendEl) {
    if (isCreator) {
      legendEl.innerHTML = `
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center text-[8px]">👑</div>
          <span class="text-amber-300">Capitano (Tu)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-[7px] text-white">✓</div>
          <span class="text-emerald-300">Confermato (@username)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-cyan-600 border border-white flex items-center justify-center text-[8px] text-white font-black">?</div>
          <span class="text-cyan-300 font-black">Cerchi Giocatore</span>
        </div>
        ${isDoublePitch ? '<div class="flex items-center gap-1.5"><span class="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40 font-mono font-bold">🏟️ DOPPIO CAMPO ATTIVO</span></div>' : ''}
      `;
    } else {
      legendEl.innerHTML = `
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-[7px] text-white">✓</div>
          <span class="text-slate-300">Confermato (@username)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-rose-600 animate-ping flex items-center justify-center text-[8px] text-white font-black">+</div>
          <span class="text-rose-400 font-black">Slot Libero (Clicca "+")</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-slate-950 font-black">⏳</div>
          <span class="text-amber-300 font-black">Tua Candidatura</span>
        </div>
        ${isDoublePitch ? '<div class="flex items-center gap-1.5"><span class="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40 font-mono font-bold">🏟️ DOPPIO CAMPO ATTIVO</span></div>' : ''}
      `;
    }
  }

  // 7. Render players onto tactical board - PRESERVES EXACT MODULO FOR ALL PLAYERS
  slots.forEach(s => {
    const node = document.createElement('div');
    node.className = 'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none';
    node.style.left = `${s.l}%`;
    node.style.top = `${s.t}%`;

    const teamSuffix = isDoublePitch && s.team ? ` (${s.team})` : '';

    if (s.isMissing) {
      if (isCreator) {
        // Organizer views the unconfirmed / missing slot in its tactical modulo role!
        node.className += ' cursor-pointer group';
        node.onclick = () => {
          closePitchModal();
          openMatchApplicationsModal(match.id);
        };
        node.innerHTML = `
          <div class="missing-slot-radar-cyan w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-cyan-600 hover:bg-cyan-500 border-2 border-white text-white font-black text-xs flex items-center justify-center shadow-lg group-hover:scale-105 transition">
            <i data-lucide="user-plus" class="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]"></i>
          </div>
          <span class="text-[9px] sm:text-[10px] font-black text-cyan-200 bg-cyan-950/95 border border-cyan-500/80 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider shadow whitespace-nowrap">
            CERCHI ${s.shortRole}${teamSuffix}
          </span>
        `;
      } else if (s.isUserApplied) {
        // User already applied to this specific role slot!
        node.className += ' cursor-pointer group';
        node.onclick = () => showAlreadyAppliedNotice(match, s.role);
        node.innerHTML = `
          <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500/25 border-2 border-amber-400 text-amber-300 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse group-hover:scale-105 transition">
            <i data-lucide="clock" class="w-4 h-4 sm:w-5 sm:h-5 text-amber-400"></i>
          </div>
          <span class="text-[9px] sm:text-[10px] font-black text-amber-200 bg-amber-950/95 border border-amber-500/60 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider shadow whitespace-nowrap">
            TU: CANDIDATO (${s.shortRole}${teamSuffix})
          </span>
        `;
      } else if (isDeadlinePassed || isTimeEnded) {
        // Closed / Time passed
        node.innerHTML = `
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-slate-700 text-slate-500 font-bold text-xs flex items-center justify-center shadow">
            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
          </div>
          <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-black/90 px-1.5 py-0.5 rounded-full mt-1 border border-slate-800 whitespace-nowrap">
            CHIUSO
          </span>
        `;
      } else if (hasReachedMaxApplications) {
        // Reached max allowed applications
        node.className += ' cursor-pointer group opacity-60 hover:opacity-100 transition';
        node.onclick = () => alert(`Hai già inviato ${appliedCount} candidature per questa partita (il massimo consentito per i ${maxApplicationsAllowed} posti disponibili).`);
        node.innerHTML = `
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-slate-600 text-slate-400 font-bold text-xs flex items-center justify-center shadow group-hover:border-amber-400 transition">
            <i data-lucide="ban" class="w-4 h-4 text-slate-400 group-hover:text-amber-400"></i>
          </div>
          <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-black/90 px-1.5 py-0.5 rounded-full mt-1 border border-slate-800 group-hover:text-amber-300 whitespace-nowrap">
            MAX RAGGIUNTO (${s.shortRole}${teamSuffix})
          </span>
        `;
      } else {
        // Open for candidate! Lampeggiante con il tasto "+"
        node.className += ' cursor-pointer group';
        node.onclick = () => triggerApplyFromModal(s.role);
        node.innerHTML = `
          <div class="missing-slot-radar w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600 hover:bg-rose-500 border-2 border-white text-white font-black text-xs flex items-center justify-center shadow-xl group-hover:scale-105 transition">
            <i data-lucide="plus" class="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]"></i>
          </div>
          <span class="text-[9px] sm:text-[10px] font-black text-rose-200 bg-rose-950/95 border border-rose-500/80 px-2 py-0.5 rounded-full mt-1 animate-pulse uppercase tracking-wider shadow whitespace-nowrap">
            CERCASI ${s.shortRole}${teamSuffix}
          </span>
        `;
      }
    } else {
      // Confirmed player slot - Display username and person who took the slot
      const isCaptain = Boolean(s.isCaptainSlot);
      const confPlayer = s.assignedConfirmedPlayer;
      const hasTakenPlayer = Boolean(confPlayer && (confPlayer.player_username || confPlayer.player_name || confPlayer.name));

      let displayName = "";
      let usernameTag = "";
      let fullPlayerName = "";
      let playerOvr = confPlayer?.player_ovr || null;

      if (isCaptain) {
        fullPlayerName = match.organizer_name || 'Organizzatore';
        const rawUser = confPlayer?.player_username || match.creator_username || match.organizer_name || 'Capitano';
        usernameTag = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;
        displayName = `👑 ${usernameTag}`;
      } else if (hasTakenPlayer) {
        fullPlayerName = confPlayer.player_name || confPlayer.name || 'Giocatore';
        const rawUser = confPlayer.player_username || confPlayer.player_name || confPlayer.name;
        usernameTag = rawUser.startsWith('@') ? rawUser : `@${rawUser}`;
        displayName = `✓ ${usernameTag}`;
      } else {
        fullPlayerName = `Giocatore Confermato`;
        displayName = `✓ Confermato (${s.shortRole}${teamSuffix})`;
      }

      node.className += ' cursor-pointer group';
      node.onclick = () => {
        const teamDesc = isDoublePitch ? (s.team === 'A' ? ' (Squadra A Casa)' : ' (Squadra B Ospiti)') : '';
        if (isCaptain) {
          alert(`👑 CAPITANO & ORGANIZZATORE\n\n👤 Nome: ${fullPlayerName}\n🏷️ Username: ${usernameTag}\n⚽ Ruolo in campo: ${s.role}${teamDesc}`);
        } else if (hasTakenPlayer) {
          const ovrStr = playerOvr ? ` • OVR ${playerOvr}` : '';
          alert(`✅ SLOT CONFERMATO ALLA PARTITA\n\n👤 Giocatore: ${fullPlayerName}\n🏷️ Username: ${usernameTag}${ovrStr}\n⚽ Ruolo in campo: ${s.role}${teamDesc}\n\nQuesto slot è stato preso ufficialmente da ${usernameTag}!`);
        } else {
          alert(`✅ SLOT CONFERMATO\n\n⚽ Ruolo in campo: ${s.role}${teamDesc}\nQuesto giocatore è confermato nella rosa della partita.`);
        }
      };

      node.innerHTML = `
        <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950 border-2 ${isCaptain ? 'border-amber-400 text-amber-300 shadow-amber-400/20' : 'border-emerald-400 text-emerald-300 shadow-emerald-400/20'} font-bold text-xs flex items-center justify-center shadow-lg relative group-hover:scale-110 transition">
          ${isCaptain ? '<span class="text-xs">👑</span>' : `<span class="font-mono font-black">${playerOvr ? playerOvr : s.num}</span>`}
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 ${isCaptain ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-slate-950'} rounded-full flex items-center justify-center text-[8px] font-black shadow" title="Confermato">✓</span>
        </div>
        <span class="text-[9px] sm:text-[10px] font-black ${isCaptain ? 'text-amber-200 bg-amber-950/95 border border-amber-500/60' : 'text-emerald-200 bg-slate-950/95 border border-emerald-500/50'} px-2 py-0.5 rounded-full mt-1 shadow whitespace-nowrap max-w-[110px] sm:max-w-[130px] truncate" title="${fullPlayerName} (${usernameTag}) • ${s.role}${teamSuffix}">
          ${displayName}
        </span>
      `;
    }

    layer.appendChild(node);
  });

  // 8. Footer Action Button Configuration
  const applyBtn = document.getElementById('pitchModalApplyBtn');
  const applyBtnText = document.getElementById('pitchModalApplyBtnText');
  const footerStatus = document.getElementById('pitchModalFooterStatus');

  if (isTimeEnded) {
    if (isCreator) {
      applyBtn.disabled = false;
      applyBtn.className = "btn-shimmer w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25";
      applyBtnText.innerText = "⭐ Valuta Giocatori";
      applyBtn.onclick = () => {
        closePitchModal();
        openReviewModalForMatch(match.id);
      };
      footerStatus.innerText = "Partita conclusa all'orario previsto.";
    } else {
      applyBtn.disabled = true;
      applyBtn.className = "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700";
      applyBtnText.innerText = "Partita Conclusa";
      footerStatus.innerText = "Orario ufficiale terminato.";
    }
  } else if (isCreator) {
    const appsCount = match.applications_count !== undefined ? match.applications_count : (match.applications ? match.applications.length : 0);
    applyBtn.disabled = false;
    applyBtn.className = "btn-shimmer w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer";
    applyBtnText.innerText = `👥 Gestisci Candidati (${appsCount})`;
    applyBtn.onclick = () => {
      closePitchModal();
      openMatchApplicationsModal(match.id);
    };
    footerStatus.innerText = "Sei l'organizzatore: non puoi candidarti alla tua partita.";
  } else if (isFull) {
    applyBtn.disabled = true;
    applyBtn.className = "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700";
    applyBtnText.innerText = "🔒 Squadra al Completo";
    footerStatus.innerText = "Nessun posto libero disponibile.";
  } else if (isDeadlinePassed) {
    applyBtn.disabled = true;
    applyBtn.className = "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700";
    applyBtnText.innerText = "⛔ Tempo Limite Scaduto";
    footerStatus.innerText = `Candidature chiuse alle ore ${match.deadline_time}.`;
  } else if (appliedStatus === 'accepted') {
    applyBtn.disabled = true;
    applyBtn.className = "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 font-black text-sm flex items-center justify-center gap-2 border border-emerald-500/50 cursor-default";
    applyBtnText.innerText = "✅ Sei Confermato in Squadra!";
    footerStatus.innerText = "Ci vediamo in campo!";
  } else {
    const missingSlots = slots.filter(s => s.isMissing);
    const unappliedSlots = missingSlots.filter(s => !s.isUserApplied);

    if (hasReachedMaxApplications) {
      applyBtn.disabled = true;
      applyBtn.className = "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 text-amber-300 font-black text-sm flex items-center justify-center gap-2 border border-amber-500/40 cursor-default";
      applyBtnText.innerText = `Candidature Inviate (${appliedCount}/${maxApplicationsAllowed})`;
      footerStatus.innerHTML = `
        <span>Hai raggiunto il massimo di candidature (${maxApplicationsAllowed}).</span>
        ${!isDeadlinePassed ? `<button type="button" onclick="cancelMatchApplication(${match.id})" class="ml-2 text-rose-400 hover:text-rose-300 underline font-bold text-xs">Annulla</button>` : ''}
      `;
    } else if (appliedCount > 0 && unappliedSlots.length > 0) {
      applyBtn.disabled = false;
      applyBtn.className = "btn-shimmer w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition";
      applyBtnText.innerText = `✋ Candidati anche come ${unappliedSlots[0].shortRole}! (${appliedCount + 1}/${maxApplicationsAllowed})`;
      applyBtn.onclick = () => triggerApplyFromModal(unappliedSlots[0].role);
      footerStatus.innerText = `Hai inviato ${appliedCount} candidatura/e. Puoi candidarti per altri ${maxApplicationsAllowed - appliedCount} posti!`;
    } else {
      applyBtn.disabled = false;
      applyBtn.className = "btn-shimmer w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition";
      applyBtnText.innerText = "✋ Mi Candido come Ultimo!";
      applyBtn.onclick = () => triggerApplyFromModal();
      footerStatus.innerText = "Posto disponibile!";
    }
  }

  lucide.createIcons();
}

function showAlreadyAppliedNotice(match, role) {
  SoundFX.playClick();
  const phoneClean = (match.organizer_phone || '').replace(/[^0-9]/g, '');
  const roleText = role ? ` nel ruolo di ${role}` : '';
  const msgText = encodeURIComponent(`Ciao ${match.organizer_name}! Ti ricontatto su WhatsApp riguardo alla mia candidatura${roleText} su 'Trova l'Ultimo' per la partita al ${match.field_name}.`);
  const waUrl = phoneClean ? `https://wa.me/${phoneClean}?text=${msgText}` : '#';

  let canCancel = true;
  if (match.deadline_time && match.match_date) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);
    if (match.match_date < todayStr || (match.match_date === todayStr && nowTime > match.deadline_time)) {
      canCancel = false;
    }
  }
  if (match.user_application_status === 'accepted') {
    canCancel = false;
  }

  if (confirm(`Ti sei già candidato${roleText} per questa partita!\n\nL'organizzatore (${match.organizer_name}) deve confermarti in app.\n\nVuoi aprire WhatsApp per scrivergli direttamente?${canCancel ? '\n\n(Oppure premi ANNULLA se desideri ritirare la tua candidatura).' : ''}`)) {
    if (waUrl !== '#') window.open(waUrl, '_blank');
  } else if (canCancel) {
    if (confirm(`Vuoi ritirare e ANNULLARE la tua candidatura${roleText} per la partita "${match.title}"?`)) {
      cancelMatchApplication(match.id, role);
    }
  }
}

async function cancelMatchApplication(matchId, role) {
  requireAuthAndExecute(async () => {
    const match = state.matches.find(m => m.id === matchId) || state.activeMatchForPitch;
    const roleText = role ? ` nel ruolo di ${role}` : '';

    if (!confirm(`Sei sicuro di voler annullare la tua candidatura${roleText} per questa partita?\n\n(Operazione consentita solo entro il tempo limite e se non sei ancora stato accettato).`)) {
      return;
    }

    try {
      const playerId = state.currentUser ? (state.currentUser.player_id || ('user_' + state.currentUser.id)) : 'my_profile';
      const res = await fetch(`/api/matches/${matchId}/cancel_application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          player_role: role || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Impossibile annullare la candidatura.");
        return;
      }

      alert(data.message || "Candidatura annullata con successo!");

      if (match) {
        if (role && match.user_applied_roles) {
          match.user_applied_roles = match.user_applied_roles.filter(r => r.toLowerCase() !== role.toLowerCase());
          if (match.user_applied_roles.length === 0) {
            match.user_application_status = null;
          }
        } else {
          match.user_applied_roles = [];
          match.user_application_status = null;
        }
      }

      if (state.activeMatchForPitch && state.activeMatchForPitch.id === matchId) {
        if (role && state.activeMatchForPitch.user_applied_roles) {
          state.activeMatchForPitch.user_applied_roles = state.activeMatchForPitch.user_applied_roles.filter(r => r.toLowerCase() !== role.toLowerCase());
          if (state.activeMatchForPitch.user_applied_roles.length === 0) {
            state.activeMatchForPitch.user_application_status = null;
          }
        } else {
          state.activeMatchForPitch.user_applied_roles = [];
          state.activeMatchForPitch.user_application_status = null;
        }
        renderPitch(state.activeMatchForPitch);
      }

      renderMatches();
      fetchMatches();
    } catch (e) {
      console.error(e);
      alert("Errore durante l'annullamento della candidatura.");
    }
  });
}

function triggerApplyFromModal(role) {
  if (!state.activeMatchForPitch) return;
  const match = state.activeMatchForPitch;

  if (isMatchCreator(match)) {
    closePitchModal();
    openMatchApplicationsModal(match.id);
    return;
  }

  if (match.user_application_status === 'accepted') {
    alert("Sei già stato confermato ufficialmente in squadra per questa partita!");
    return;
  }
  if (match.missing_count === 0 || match.status === 'filled') {
    alert("Questa partita è già al completo!");
    return;
  }

  const applied = (match.user_applied_roles || []).map(r => (r || '').toLowerCase());
  const maxApplications = match.missing_count || 1;
  if (applied.length >= maxApplications) {
    alert(`Hai già inviato ${applied.length} candidature per questa partita, che è il massimo consentito per i posti disponibili (${maxApplications}). Non puoi candidarti per altri posti.`);
    return;
  }

  if (role && applied.includes(role.toLowerCase())) {
    showAlreadyAppliedNotice(match, role);
    return;
  }

  let roleToUse = role;
  if (!roleToUse) {
    const rolesNeeded = Array.isArray(match.roles_needed) ? match.roles_needed : (typeof match.roles_needed === 'string' ? JSON.parse(match.roles_needed || '[]') : [match.roles_needed]);
    roleToUse = rolesNeeded.find(r => !applied.includes((r || '').toLowerCase())) || "Jolly";
  }

  closePitchModal();
  applyToMatch(match.id, roleToUse);
}

// ----------------------------------------------------
// APPLY AS "L'ULTIMO" (WITH EXPLICIT PHONE DISPLAY)
// ----------------------------------------------------
async function applyToMatch(matchId, chosenRole) {
  requireAuthAndExecute(async () => {
    const match = state.matches.find(m => m.id === matchId);
    if (match && isMatchCreator(match)) {
      alert("Non puoi candidarti alla tua stessa partita! Sei tu l'organizzatore.");
      openMatchApplicationsModal(match.id);
      return;
    }

    const p = state.profile || {
      name: state.currentUser.full_name,
      primary_role: "Centrocampista",
      phone: state.currentUser.phone || "",
      ovr: 78
    };

    const roleToApply = chosenRole || p.primary_role || "Jolly";

    if (match) {
      if (match.user_application_status === 'accepted') {
        alert("Sei già stato confermato ufficialmente in squadra per questa partita!");
        return;
      }
      const applied = (match.user_applied_roles || []).map(r => (r || '').toLowerCase());
      if (applied.includes(roleToApply.toLowerCase())) {
        alert(`Ti sei già candidato come ${roleToApply} per questa partita! Non puoi candidarti due volte per lo stesso ruolo. Se ci sono altri ruoli mancanti, puoi candidarti anche per quelli oppure contattare l'organizzatore su WhatsApp.`);
        showAlreadyAppliedNotice(match, roleToApply);
        return;
      }
      if (match.missing_count === 0 || match.status === 'filled') {
        alert("Questa partita è già al completo!");
        return;
      }
    }

    SoundFX.playWhistle();
    SoundFX.playGoalCheer();

    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    try {
      const res = await fetch(`/api/matches/${matchId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: state.currentUser.player_id || ("user_" + state.currentUser.id),
          player_name: p.name,
          player_username: state.currentUser.username || "",
          player_role: roleToApply,
          player_phone: p.phone,
          player_ovr: p.ovr || 81,
          message: `Sono pronto per stasera nel ruolo di ${roleToApply}! Ho scarpini, parastinchi e quota pronta.`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Impossibile candidarsi a questa partita.");
        return;
      }

      if (data.success) {
        if (match) {
          if (!match.user_applied_roles) match.user_applied_roles = [];
          if (!match.user_applied_roles.includes(roleToApply)) {
            match.user_applied_roles.push(roleToApply);
          }
          match.user_application_status = 'pending';
        }
        if (state.activeMatchForPitch && state.activeMatchForPitch.id === matchId) {
          if (!state.activeMatchForPitch.user_applied_roles) state.activeMatchForPitch.user_applied_roles = [];
          if (!state.activeMatchForPitch.user_applied_roles.includes(roleToApply)) {
            state.activeMatchForPitch.user_applied_roles.push(roleToApply);
          }
          state.activeMatchForPitch.user_application_status = 'pending';
        }

        renderMatches();

        document.getElementById('applyOrganizerName').innerText = data.organizer_name;
        document.getElementById('applyOrganizerPhone').innerText = data.organizer_phone;
        const phoneLink = document.getElementById('applyOrganizerPhoneLink');
        if (phoneLink) phoneLink.href = data.whatsapp_url;
        document.getElementById('applyWhatsAppBtn').href = data.whatsapp_url;

        document.getElementById('applySuccessModal').classList.remove('hidden');
        document.getElementById('applySuccessModal').classList.add('flex');
        document.body.classList.add('overflow-hidden');

        fetchUserProfile();
      }
    } catch (e) {
      console.error(e);
      alert("Errore di connessione.");
    }
  });
}

function closeApplyModal() {
  SoundFX.playClick();
  document.getElementById('applySuccessModal').classList.add('hidden');
  document.getElementById('applySuccessModal').classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  fetchMatches();
  if (state.activeMatchForPitch) {
    const updated = state.matches.find(m => m.id === state.activeMatchForPitch.id);
    if (updated) renderPitch(updated);
  }
}

// ----------------------------------------------------
// DIRECT ORGANIZER WHATSAPP (UNLOCKED AFTER CANDIDACY)
// ----------------------------------------------------
function openOrganizerWhatsAppDirect(matchId) {
  SoundFX.playClick();
  const match = state.matches.find(m => m.id === matchId) || state.activeMatchForPitch;
  if (!match) return;

  const rawPhone = match.organizer_phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    alert("Numero WhatsApp non disponibile per questo organizzatore.");
    return;
  }

  const roleText = (match.user_applied_roles && match.user_applied_roles.length > 0) 
    ? ` nel ruolo di ${match.user_applied_roles.join('/')}` 
    : '';

  const text = encodeURIComponent(
    `Ciao ${match.organizer_name}! Ti scrivo da Trova l'Ultimo: ho inviato la mia candidatura${roleText} per la partita "${match.title}" del ${match.match_date} ore ${match.match_time} al ${match.field_name}. Sono pronto per scendere in campo!`
  );

  window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
}

function handlePhoneClickBeforeApply(matchId) {
  SoundFX.playClick();
  const match = state.matches.find(m => m.id === matchId) || state.activeMatchForPitch;
  if (!match) return;

  const wantToApply = confirm(
    `🔒 Il contatto WhatsApp diretto è riservato ai candidati!\n\nPer garantire la massima serietà ed evitare spam, il numero dell'organizzatore (${match.organizer_name}) diventa attivo non appena invii la tua candidatura.\n\nVuoi inviare la tua candidatura ORA per questa partita e aprire WhatsApp?`
  );

  if (wantToApply) {
    applyToMatch(matchId);
  }
}

// ----------------------------------------------------
// POST-MATCH FEEDBACK
// ----------------------------------------------------
function openFeedbackModal(matchId, matchTitle, targetPlayerId) {
  SoundFX.playClick();
  requireAuthAndExecute(() => {
    const select = document.getElementById('reviewTargetPlayer');
    if (targetPlayerId && select) select.value = targetPlayerId;
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
    document.body.classList.add('overflow-hidden');
    lucide.createIcons();
  });
}

function openFeedbackModalDirect() {
  requireAuthAndExecute(() => {
    if (state.pendingReviews && state.pendingReviews.length > 0) {
      openFeedbackModalForPlayer(state.pendingReviews[0]);
    } else {
      openFeedbackModalWithNoPendingPlayer();
    }
  });
}

function openFeedbackModalWithNoPendingPlayer() {
  SoundFX.playClick();
  document.getElementById('reviewMatchId').value = '';
  document.getElementById('reviewMatchTitle').value = '';
  document.getElementById('reviewTargetPlayerId').value = '';
  document.getElementById('reviewTargetPlayerName').value = '';

  const nameDisplay = document.getElementById('reviewTargetPlayerNameDisplay');
  const roleDisplay = document.getElementById('reviewTargetRoleDisplay');
  const contextDisplay = document.getElementById('reviewMatchContextDisplay');
  const avatarDisplay = document.getElementById('reviewTargetAvatar');

  if (nameDisplay) nameDisplay.innerText = "Nessun giocatore da valutare";
  if (roleDisplay) roleDisplay.innerText = "Nessun Voto Attivo";
  if (contextDisplay) contextDisplay.innerText = "Al momento non ci sono partite concluse con compagni da votare";
  if (avatarDisplay) avatarDisplay.innerHTML = "⏳";

  const previewBox = document.getElementById('reviewPlayerCardPreviewBox');
  if (previewBox) previewBox.classList.add('hidden');
  const discSec = document.getElementById('skillDiscrepancySection');
  if (discSec) discSec.classList.add('hidden');

  setReviewPersonRating(5);
  setReviewSkillRating(5);
  const comment = document.getElementById('reviewComment');
  if (comment) comment.value = '';
  const discDetails = document.getElementById('reviewDiscrepancyDetails');
  if (discDetails) discDetails.value = '';

  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
  }
  document.body.classList.add('overflow-hidden');
}

function closeFeedbackModal() {
  SoundFX.playClick();
  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.classList.remove('overflow-hidden');
}

// ----------------------------------------------------
// TWO-FACTOR POST-MATCH REVIEWS (Persona & Scheda Calcio)
// ----------------------------------------------------
function setReviewPersonRating(stars) {
  SoundFX.playClick();
  document.getElementById('selectedPersonRating').value = stars;
  const descEl = document.getElementById('personRatingDesc');
  const labels = [
    '',
    '1/5 • Pacco / Maleducato ⚠️',
    '2/5 • Molto in ritardo / Storie per quota',
    '3/5 • Sufficiente con riserva',
    '4/5 • Buono e affidabile',
    '5/5 • Puntuale & Paga Subito ⭐'
  ];
  if (descEl) descEl.innerText = labels[stars] || `${stars}/5`;
  const buttons = document.querySelectorAll('#personStarContainer .person-star-btn');
  buttons.forEach((btn, idx) => {
    const icon = btn.querySelector('svg') || btn.querySelector('i');
    if (idx < stars) {
      btn.classList.add('active');
      if (icon) {
        icon.classList.add('fill-amber-400');
        icon.classList.remove('text-slate-600');
      }
    } else {
      btn.classList.remove('active');
      if (icon) {
        icon.classList.remove('fill-amber-400');
        icon.classList.add('text-slate-600');
      }
    }
  });
}

function setReviewSkillRating(stars) {
  SoundFX.playClick();
  document.getElementById('selectedSkillRating').value = stars;
  const descEl = document.getElementById('skillRatingDesc');
  const labels = [
    '',
    '1/5 • Scheda Gonfiata / Ha detto frottole 🧢',
    '2/5 • Molto distante dalla scheda ⚠️',
    '3/5 • Abbastanza vicino alla scheda',
    '4/5 • Fedele al ruolo e livello',
    '5/5 • 100% Fedele alla Scheda 🎯'
  ];
  if (descEl) descEl.innerText = labels[stars] || `${stars}/5`;
  const buttons = document.querySelectorAll('#skillStarContainer .skill-star-btn');
  buttons.forEach((btn, idx) => {
    const icon = btn.querySelector('svg') || btn.querySelector('i');
    if (idx < stars) {
      btn.classList.add('active');
      if (icon) {
        icon.classList.add('fill-emerald-400');
        icon.classList.remove('text-slate-600');
      }
    } else {
      btn.classList.remove('active');
      if (icon) {
        icon.classList.remove('fill-emerald-400');
        icon.classList.add('text-slate-600');
      }
    }
  });

  // Mostra o nasconde la sezione discrepanza obbligatoria per 1 o 2 stelle
  const discSec = document.getElementById('skillDiscrepancySection');
  if (discSec) {
    if (stars <= 2) {
      discSec.classList.remove('hidden');
    } else {
      discSec.classList.add('hidden');
    }
  }
}

async function toggleReviewPlayerCardPreview() {
  SoundFX.playClick();
  const box = document.getElementById('reviewPlayerCardPreviewBox');
  const btnText = document.getElementById('playerCardPreviewBtnText');
  if (!box) return;

  if (!box.classList.contains('hidden')) {
    box.classList.add('hidden');
    if (btnText) btnText.innerText = "🔍 Rivedi Scheda del Giocatore";
    return;
  }

  const targetPlayerId = document.getElementById('reviewTargetPlayerId').value;
  if (!targetPlayerId) {
    alert("Dati giocatore non disponibili.");
    return;
  }

  try {
    const res = await fetch(`/api/players/${encodeURIComponent(targetPlayerId)}`);
    if (!res.ok) throw new Error("Errore recupero scheda");
    const p = await res.json();

    const avatar = document.getElementById('previewCardAvatar');
    const name = document.getElementById('previewCardName');
    const sub = document.getElementById('previewCardSub');
    const ovr = document.getElementById('previewCardOvr');
    const bio = document.getElementById('previewCardBio');

    if (avatar) avatar.src = p.photo_url || '/static/avatars/bomber.svg';
    if (name) name.innerText = (p.name || 'Giocatore').toUpperCase();
    if (sub) sub.innerText = `${p.primary_role || 'Giocatore'} • Piede ${p.foot || 'Destro'} • ${p.age || 25} anni • ${p.city || 'Milano'}`;
    if (ovr) ovr.innerText = `${p.ovr || 75} OVR`;
    if (bio) bio.innerText = `"${p.bio || 'Pronto a dare il massimo sul campo!'}"`;

    ['vel', 'tir', 'pas', 'dri', 'dif', 'fis'].forEach(st => {
      const el = document.getElementById(`previewStat_${st}`);
      if (el) el.innerText = p[`stats_${st}`] || 75;
    });

    box.classList.remove('hidden');
    if (btnText) btnText.innerText = "🔼 Nascondi Scheda Giocatore";
    lucide.createIcons();
  } catch (err) {
    console.error(err);
    alert("Impossibile caricare la scheda del giocatore.");
  }
}

async function checkPendingReviews() {
  if (!state.currentUser) {
    const banner = document.getElementById('pendingReviewBanner');
    if (banner) banner.classList.add('hidden');
    return;
  }
  const userId = state.currentUser.player_id || state.currentUser.username;
  try {
    const res = await fetch(`/api/reviews/pending?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();
    state.pendingReviews = data.pending_reviews || [];
    const banner = document.getElementById('pendingReviewBanner');
    if (state.pendingReviews.length > 0) {
      const first = state.pendingReviews[0];
      const matchTitle = document.getElementById('pendingReviewMatchTitle');
      const matchDate = document.getElementById('pendingReviewMatchDate');
      const playerDesc = document.getElementById('pendingReviewPlayerDesc');
      if (matchTitle) matchTitle.innerText = `Partita Conclusa: "${first.match_title}"`;
      if (matchDate) matchDate.innerText = `${first.match_date} (ore ${first.match_time}${first.end_time ? ' - ' + first.end_time : ''})`;
      if (playerDesc) playerDesc.innerText = `${first.target_player_name} (${first.target_player_role}) ha giocato con te. Lascia il tuo feedback su puntualità/persona e fedeltà della sua scheda calcio!`;
      if (banner) banner.classList.remove('hidden');
    } else {
      if (banner) banner.classList.add('hidden');
    }
  } catch (e) {
    console.error("Error checking pending reviews:", e);
  }
}

function openPendingReviewModal() {
  if (!state.pendingReviews || state.pendingReviews.length === 0) {
    openFeedbackModalWithNoPendingPlayer();
    return;
  }
  const item = state.pendingReviews[0];
  openFeedbackModalForPlayer(item);
}

function openFeedbackModalForPlayer(item) {
  SoundFX.playClick();
  document.getElementById('reviewMatchId').value = item.match_id || '';
  document.getElementById('reviewMatchTitle').value = item.match_title || '';
  document.getElementById('reviewTargetPlayerId').value = item.target_player_id || '';
  document.getElementById('reviewTargetPlayerName').value = item.target_player_name || '';

  const nameDisplay = document.getElementById('reviewTargetPlayerNameDisplay');
  const roleDisplay = document.getElementById('reviewTargetRoleDisplay');
  const contextDisplay = document.getElementById('reviewMatchContextDisplay');
  if (nameDisplay) nameDisplay.innerText = item.target_player_name || 'Giocatore';
  if (roleDisplay) roleDisplay.innerText = `${item.target_player_role || 'Giocatore'} • ${item.target_player_ovr || 80} OVR`;
  if (contextDisplay) contextDisplay.innerText = `Partita: ${item.match_title || 'Calcetto'} (${item.match_date || ''})`;

  // Reset drawer and discrepancy section
  const previewBox = document.getElementById('reviewPlayerCardPreviewBox');
  if (previewBox) previewBox.classList.add('hidden');
  const btnText = document.getElementById('playerCardPreviewBtnText');
  if (btnText) btnText.innerText = "🔍 Rivedi Scheda del Giocatore";

  const discSec = document.getElementById('skillDiscrepancySection');
  if (discSec) discSec.classList.add('hidden');

  setReviewPersonRating(5);
  setReviewSkillRating(5);
  const comment = document.getElementById('reviewComment');
  if (comment) comment.value = '';
  const discDetails = document.getElementById('reviewDiscrepancyDetails');
  if (discDetails) discDetails.value = '';

  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
  }
  document.body.classList.add('overflow-hidden');
}

function closeFeedbackModal() {
  SoundFX.playClick();
  const modal = document.getElementById('feedbackModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.classList.remove('overflow-hidden');
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  SoundFX.playWhistle();

  const targetPlayerId = document.getElementById('reviewTargetPlayerId').value;
  if (!targetPlayerId) {
    alert("Non c'è alcun giocatore selezionato da valutare al momento.");
    return;
  }

  const matchId = document.getElementById('reviewMatchId').value;
  const matchTitle = document.getElementById('reviewMatchTitle').value;
  const targetPlayerName = document.getElementById('reviewTargetPlayerName').value;
  const ratingPerson = parseInt(document.getElementById('selectedPersonRating').value) || 5;
  const ratingSkill = parseInt(document.getElementById('selectedSkillRating').value) || 5;
  const tag = document.getElementById('reviewReliabilityTag').value;
  const comment = document.getElementById('reviewComment').value.trim();

  let discrepancyType = "";
  const discRadio = document.querySelector('input[name="discrepancyType"]:checked');
  if (discRadio) discrepancyType = discRadio.value;

  const discrepancyAttrs = [];
  document.querySelectorAll('.discrepancy-attr-cb:checked').forEach(cb => discrepancyAttrs.push(cb.value));

  const discrepancyDetails = (document.getElementById('reviewDiscrepancyDetails')?.value || '').trim();

  // Validazione obbligatoria per 1 o 2 stelle sulla scheda
  if (ratingSkill <= 2) {
    if (!discrepancyDetails || discrepancyDetails.length < 5) {
      alert("⚠️ Per assegnare 1 o 2 stelle alla fedeltà scheda devi spiegare bene il motivo (se vale di meno o di più e quali skill correggere) per consentire all'app di inviare il feedback costruttivo al giocatore!");
      const detailsEl = document.getElementById('reviewDiscrepancyDetails');
      if (detailsEl) detailsEl.focus();
      return;
    }
  }

  const reviewerId = state.currentUser ? (state.currentUser.player_id || state.currentUser.username) : "user";
  const reviewerName = state.currentUser ? state.currentUser.full_name : "Organizzatore Partita";

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: matchId ? parseInt(matchId) : null,
        match_title: matchTitle,
        reviewer_id: reviewerId,
        reviewer_name: reviewerName,
        target_player_id: targetPlayerId,
        target_player_name: targetPlayerName,
        rating_person: ratingPerson,
        rating_skill: ratingSkill,
        reliability_tag: tag,
        comment: comment,
        discrepancy_type: discrepancyType,
        discrepancy_attributes: discrepancyAttrs,
        discrepancy_details: discrepancyDetails
      })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Impossibile inviare la valutazione.");
      return;
    }

    if (data.success) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      closeFeedbackModal();
      await checkPendingReviews();
      fetchUserProfile();
      loadUserMatchHistory();

      if (state.pendingReviews && state.pendingReviews.length > 0) {
        alert("Valutazione salvata in modo permanente! C'è ancora un compagno in attesa di valutazione per questa partita.");
        openFeedbackModalForPlayer(state.pendingReviews[0]);
      } else {
        alert(data.message || "Feedback salvato in modo definitivo e permanente! Tutte le valutazioni per questa partita sono concluse.");
      }
    }
  } catch (err) {
    alert("Errore nell'invio del feedback.");
  }
}

// ----------------------------------------------------
// STORICO PARTITE CONCLUSE (ORGANIZZATORE & PARTECIPANTE)
// ----------------------------------------------------
async function loadUserMatchHistory() {
  if (!state.currentUser) return;
  const userId = getCurrentPlayerId();
  const container = document.getElementById('userMatchHistoryContainer');
  const countBadge = document.getElementById('userMatchHistoryCountBadge');
  const emptyBox = document.getElementById('userMatchHistoryEmpty');
  const playedDisplay = document.getElementById('cardMatchesPlayedDisplay');

  try {
    const res = await fetch(`/api/players/${encodeURIComponent(userId)}/history`);
    const data = await res.json();
    const history = data.history || [];

    if (countBadge) countBadge.innerText = `${history.length} Partite`;
    if (playedDisplay) playedDisplay.innerText = history.length;

    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = '';
      if (emptyBox) emptyBox.classList.remove('hidden');
      return;
    }

    if (emptyBox) emptyBox.classList.add('hidden');

    container.innerHTML = history.map(m => {
      return `
        <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-lg">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                CALCIO A ${m.format}
              </span>
              <span class="px-2 py-0.5 rounded bg-black/70 text-amber-300 text-[10px] font-black border border-amber-400/40">
                ${m.user_role}
              </span>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-400">
              ${m.match_date}
            </span>
          </div>

          <div>
            <h4 class="font-extrabold text-white text-sm line-clamp-1">${m.title}</h4>
            <p class="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0"></i>
              <span class="line-clamp-1">${m.field_name} • ${m.city}</span>
            </p>
            <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-400 flex-shrink-0"></i>
              <span>Fischio d'inizio: ore ${m.match_time}${m.end_time ? ' - fine ore ' + m.end_time : ''}</span>
            </p>
          </div>

          <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span class="text-[11px] font-black text-slate-400">
              Conclusa Ufficialmente
            </span>
            ${m.is_creator ? (
              m.unreviewed_count > 0 ? `
                <button onclick="openReviewModalForMatch(${m.match_id})" class="btn-shimmer px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20">
                  <i data-lucide="star" class="w-3.5 h-3.5 fill-slate-950"></i>
                  Valuta (${m.unreviewed_count})
                </button>
              ` : `
                <span class="text-[10px] font-black text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                  Valutazioni Completate
                </span>
              `
            ) : `
              <span class="text-[10px] font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1">
                <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>
                Presenza a Referto
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  } catch (e) {
    console.error("Error loading user match history:", e);
  }
}

// ----------------------------------------------------
// CREATE MATCH LOGIC (GPS, Formats & Timing)
// ----------------------------------------------------
function detectGPSLocation() {
  SoundFX.playClick();
  const msgEl = document.getElementById('gpsStatusMessage');
  const txtEl = document.getElementById('gpsStatusText');

  if (!navigator.geolocation) {
    alert("Geolocalizzazione non supportata.");
    return;
  }

  msgEl.classList.remove('hidden');
  txtEl.innerText = "Rilevamento posizione GPS in corso...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      state.currentGpsCoords = { lat, lng };
      txtEl.innerText = `Posizione rilevata (${lat.toFixed(4)}, ${lng.toFixed(4)})! Indicazioni Google Maps collegate.`;
      SoundFX.playWhistle();
    },
    (err) => {
      txtEl.innerText = "Posizione impostata su Milano (puoi inserire via e civico manualmente).";
    },
    { timeout: 8000 }
  );
}

function getMaxMissingForFormat(fmt) {
  if (fmt === '7') return 13;
  if (fmt === '6') return 11;
  return 9; // Calcetto a 5
}

function onFormatChange() {
  const fmtSelect = document.getElementById('createFormatSelect');
  const fmt = fmtSelect ? fmtSelect.value : '5';
  const maxSlots = getMaxMissingForFormat(fmt);
  const input = document.getElementById('missingCountInput');
  const display = document.getElementById('missingCountDisplay');
  const hint = document.getElementById('missingCountHint');
  if (hint) {
    const total = parseInt(fmt) * 2;
    hint.innerText = `Max ${maxSlots} mancanti (Calcio a ${fmt}: ${total} giocatori in campo, tu sei già 1)`;
  }
  if (parseInt(input.value) > maxSlots) {
    input.value = maxSlots;
    display.innerText = maxSlots;
  }
}

function adjustMissingCount(delta) {
  SoundFX.playClick();
  const fmtSelect = document.getElementById('createFormatSelect');
  const fmt = fmtSelect ? fmtSelect.value : '5';
  const maxSlots = getMaxMissingForFormat(fmt);
  const input = document.getElementById('missingCountInput');
  const display = document.getElementById('missingCountDisplay');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > maxSlots) val = maxSlots;
  input.value = val;
  display.innerText = val;
}

function onStartTimeChange() {
  const startInput = document.getElementById('createMatchTime');
  const endInput = document.getElementById('createEndTime');
  if (!startInput || !endInput) return;
  const parts = startInput.value.split(':');
  if (parts.length === 2) {
    let hour = parseInt(parts[0]) + 1;
    if (hour >= 24) hour = 0;
    const hourStr = hour.toString().padStart(2, '0');
    endInput.value = `${hourStr}:${parts[1]}`;
  }
}

function startEditMatch(matchId) {
  SoundFX.playClick();
  const match = (state.matches || []).find(m => m.id === matchId);
  if (!match) return;

  switchTab('create');

  const editIdInput = document.getElementById('createMatchEditId');
  if (editIdInput) editIdInput.value = match.id;

  const form = document.getElementById('createMatchForm');
  if (!form) return;

  const titleInput = form.querySelector('input[name="title"]');
  if (titleInput) titleInput.value = match.title || '';

  const formatSelect = document.getElementById('createFormatSelect');
  if (formatSelect) {
    formatSelect.value = match.format || '5';
    onFormatChange();
  }

  const fieldInput = form.querySelector('input[name="field_name"]');
  if (fieldInput) fieldInput.value = match.field_name || '';

  const addrInput = form.querySelector('input[name="address"]');
  if (addrInput) addrInput.value = match.address || '';

  const cityInput = form.querySelector('input[name="city"]');
  if (cityInput) cityInput.value = match.city || 'Milano';

  const dateInput = form.querySelector('input[name="match_date"]');
  if (dateInput) dateInput.value = match.match_date || '';

  const timeInput = form.querySelector('input[name="match_time"]');
  if (timeInput) timeInput.value = match.match_time || '';

  const endInput = document.getElementById('createEndTime');
  if (endInput) endInput.value = match.end_time || '';

  const deadlineInput = document.getElementById('createDeadlineTime');
  if (deadlineInput) deadlineInput.value = match.deadline_time || '';

  const priceInput = form.querySelector('input[name="price_per_player"]');
  if (priceInput) priceInput.value = match.price_per_player || '8€';

  state.currentMissingCount = match.missing_count || 1;
  const missingDisplay = document.getElementById('missingCountDisplay');
  if (missingDisplay) missingDisplay.innerText = state.currentMissingCount;

  const rolesNeeded = Array.isArray(match.roles_needed) ? match.roles_needed : (typeof match.roles_needed === 'string' ? JSON.parse(match.roles_needed || '[]') : [match.roles_needed]);
  form.querySelectorAll('input[name="roles"]').forEach(cb => {
    cb.checked = rolesNeeded.includes(cb.value);
  });

  const levelSelect = form.querySelector('select[name="level"]');
  if (levelSelect) levelSelect.value = match.level || 'Amatoriale con grinta';

  const notesInput = form.querySelector('textarea[name="notes"]');
  if (notesInput) notesInput.value = match.notes || '';

  const orgName = document.getElementById('createOrganizerName');
  if (orgName) orgName.value = match.organizer_name || '';
  const orgPhone = document.getElementById('createOrganizerPhone');
  if (orgPhone) orgPhone.value = match.organizer_phone || '';

  const headerTitle = document.getElementById('createMatchHeaderTitle');
  if (headerTitle) headerTitle.innerText = `Modifica Partita: ${match.title}`;
  const headerDesc = document.getElementById('createMatchHeaderDesc');
  if (headerDesc) headerDesc.innerText = "Modifica data, orario, luogo o ruoli mancanti della tua partita.";
  const cancelBtn = document.getElementById('cancelEditMatchBtn');
  if (cancelBtn) cancelBtn.classList.remove('hidden');
  const submitBtn = document.getElementById('createMatchSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>SALVA MODIFICHE PARTITA</span>`;
    lucide.createIcons();
  }
}

function cancelMatchEditMode() {
  SoundFX.playClick();
  const form = document.getElementById('createMatchForm');
  if (form) form.reset();
  const editIdInput = document.getElementById('createMatchEditId');
  if (editIdInput) editIdInput.value = '';

  const headerTitle = document.getElementById('createMatchHeaderTitle');
  if (headerTitle) headerTitle.innerText = "Carica la tua Partita";
  const headerDesc = document.getElementById('createMatchHeaderDesc');
  if (headerDesc) headerDesc.innerText = "Manca un giocatore? Pubblica la partita: chi si candida vedrà il tuo numero per scriverti direttamente su WhatsApp!";
  const cancelBtn = document.getElementById('cancelEditMatchBtn');
  if (cancelBtn) cancelBtn.classList.add('hidden');
  const submitBtn = document.getElementById('createMatchSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = `<i data-lucide="radio" class="w-5 h-5"></i><span>PUBBLICA CHIAMATA & TROVA L'ULTIMO!</span>`;
    lucide.createIcons();
  }
  switchTab('feed');
}

async function deleteMyMatch(matchId) {
  SoundFX.playClick();
  const match = (state.matches || []).find(m => m.id === matchId);
  const title = match ? match.title : `Partita #${matchId}`;
  if (!confirm(`Sei sicuro di voler eliminare e cancellare definitivamente la partita "${title}"?\n\nTutti i giocatori eventualmente candidati riceveranno una notifica dell'annullamento.`)) {
    return;
  }

  try {
    const myId = state.currentUser ? (state.currentUser.player_id || ('user_' + state.currentUser.id)) : '';
    const res = await fetch(`/api/matches/${matchId}?user_id=${myId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Errore nella cancellazione della partita.");
      return;
    }
    alert(data.message || "Partita cancellata con successo.");
    fetchMatches();
  } catch (e) {
    alert("Errore durante la cancellazione della partita.");
  }
}

async function handleCreateMatch(e) {
  e.preventDefault();

  if (!state.currentUser) {
    requireAuthAndExecute(() => switchTab('create'));
    return;
  }

  SoundFX.playWhistle();

  const form = e.target;
  const formData = new FormData(form);

  const roles = [];
  form.querySelectorAll('input[name="roles"]:checked').forEach(cb => {
    roles.push(cb.value);
  });

  if (roles.length === 0) {
    alert("Seleziona almeno un ruolo ricercato!");
    return;
  }

  const fieldName = formData.get('field_name');
  const address = formData.get('address');
  const city = formData.get('city');

  const mapsQuery = encodeURIComponent(`${fieldName}, ${address}, ${city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const editId = document.getElementById('createMatchEditId')?.value;

  const payload = {
    title: formData.get('title'),
    format: formData.get('format'),
    field_name: fieldName,
    address: address,
    city: city,
    latitude: state.currentGpsCoords?.lat || null,
    longitude: state.currentGpsCoords?.lng || null,
    maps_url: mapsUrl,
    match_date: formData.get('match_date'),
    match_time: formData.get('match_time'),
    end_time: formData.get('end_time') || '',
    deadline_time: formData.get('deadline_time') || '',
    duration_min: 60,
    price_per_player: formData.get('price_per_player') || '8€',
    pitch_type: 'Sintetico 4G',
    missing_count: parseInt(formData.get('missing_count') || 1),
    roles_needed: roles,
    level: formData.get('level'),
    notes: formData.get('notes'),
    organizer_name: formData.get('organizer_name'),
    organizer_phone: formData.get('organizer_phone'),
    organizer_role: formData.get('organizer_role') || (state.profile?.primary_role || 'Centrocampista'),
    creator_id: state.currentUser ? (state.currentUser.player_id || ("user_" + state.currentUser.id)) : '',
    creator_username: state.currentUser ? state.currentUser.username : '',
    requester_id: state.currentUser ? (state.currentUser.player_id || ("user_" + state.currentUser.id)) : ''
  };

  if (editId) {
    try {
      const res = await fetch(`/api/matches/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Errore nella modifica della partita.");
        return;
      }
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      alert("Partita modificata con successo!");
      cancelMatchEditMode();
      fetchMatches();
    } catch (err) {
      alert("Errore nella modifica della partita.");
    }
    return;
  }

  try {
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      alert("Partita caricata con successo con geolocalizzazione Google Maps!");
      form.reset();
      switchTab('feed');
    }
  } catch (err) {
    console.error(err);
    alert("Errore nella creazione della partita.");
  }
}

// ----------------------------------------------------
// 3D CARD & PLAYER PROFILE
// ----------------------------------------------------
function initCardTilt() {
  const container = document.querySelector('.card-perspective-container');
  const card = document.getElementById('playerCardWrapper');
  const shine = document.getElementById('cardShine');
  if (!container || !card) return;

  let gyroActive = false;
  let touchHoldTimer = null;
  let is3DModeActive = false;
  let startTouchX = 0;
  let startTouchY = 0;
  let hasMoved = false;

  function applyTilt(x, y, rect, scale = 1.04) {
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mult = state.isCardFlipped ? -1 : 1;
    const rotateX = Math.min(Math.max(((y - centerY) / centerY) * -18, -25), 25);
    const rotateY = Math.min(Math.max(((x - centerX) / centerX) * (18 * mult), -25), 25);

    card.classList.remove('smooth-reset');
    card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (shine) {
      if (state.isCardFlipped) {
        shine.style.opacity = '0';
      } else {
        const shineX = Math.min(Math.max((x / rect.width) * 100, 0), 100);
        const shineY = Math.min(Math.max((y / rect.height) * 100, 0), 100);
        shine.style.setProperty('--shine-x', `${shineX.toFixed(1)}%`);
        shine.style.setProperty('--shine-y', `${shineY.toFixed(1)}%`);
        shine.style.opacity = '1';
      }
    }
  }

  function resetTilt() {
    card.classList.add('smooth-reset');
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    if (shine) shine.style.opacity = '0.35';
  }

  // 1. Mouse Events (Desktop)
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    applyTilt(x, y, rect, 1.03);
  });

  container.addEventListener('mouseleave', () => {
    resetTilt();
  });

  // 2. Touch Events (Mobile: scorrimento fluido di default, rotazione 3D solo con pressione prolungata)
  container.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    startTouchX = touch.clientX;
    startTouchY = touch.clientY;
    hasMoved = false;
    is3DModeActive = false;

    // Request gyroscope on iOS if supported
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && !gyroActive) {
      DeviceOrientationEvent.requestPermission().then(response => {
        if (response === 'granted') gyroActive = true;
      }).catch(() => {});
    }

    clearTimeout(touchHoldTimer);
    touchHoldTimer = setTimeout(() => {
      if (!hasMoved) {
        is3DModeActive = true;
        card.classList.add('touch-3d-active');
        if (navigator.vibrate) {
          try { navigator.vibrate(25); } catch (_) {}
        }
        const rect = container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        applyTilt(x, y, rect, 1.05);
      }
    }, 220);
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - startTouchX);
    const diffY = Math.abs(touch.clientY - startTouchY);

    if (!is3DModeActive) {
      if (diffX > 8 || diffY > 8) {
        hasMoved = true;
        clearTimeout(touchHoldTimer); // Annulla rotazione e lascia scorrere la pagina liberamente!
      }
      return;
    }

    // Modalità 3D attiva intenzionalmente con pressione: ruota e blocca scroll
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    applyTilt(x, y, rect, 1.05);
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  function endTouch() {
    clearTimeout(touchHoldTimer);
    is3DModeActive = false;
    hasMoved = false;
    card.classList.remove('touch-3d-active');
    resetTilt();
  }

  container.addEventListener('touchend', endTouch, { passive: true });
  container.addEventListener('touchcancel', endTouch, { passive: true });

  // 3. Gyroscope / Device Orientation (Tilt physical phone in hand)
  window.addEventListener('deviceorientation', (e) => {
    if (is3DModeActive) return;
    if (state.currentTab !== 'card' && state.currentTab !== 'profile') return;
    if (e.gamma === null || e.beta === null) return;
    gyroActive = true;

    // Normal smartphone holding posture: ~45 deg beta
    const gamma = Math.min(Math.max(e.gamma, -35), 35);
    const beta = Math.min(Math.max(e.beta - 45, -35), 35);

    const mult = state.isCardFlipped ? -1 : 1;
    const rotateX = (-beta * 0.65);
    const rotateY = (gamma * 0.65 * mult);

    card.classList.remove('smooth-reset');
    card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

    if (shine && !state.isCardFlipped) {
      const shineX = Math.min(Math.max(50 + (gamma * 1.6), 5), 95);
      const shineY = Math.min(Math.max(50 + (beta * 1.6), 5), 95);
      shine.style.setProperty('--shine-x', `${shineX.toFixed(1)}%`);
      shine.style.setProperty('--shine-y', `${shineY.toFixed(1)}%`);
      shine.style.opacity = '0.85';
    }
  }, { passive: true });
}

function flipPlayerCard() {
  SoundFX.playClick();
  const flipper = document.getElementById('playerCardFlipper');
  const wrapper = document.getElementById('playerCardWrapper');
  if (!flipper) return;

  state.isCardFlipped = !state.isCardFlipped;

  // Reset any mouse tilt on wrapper so flip transition is clean and stable
  if (wrapper) {
    wrapper.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  if (state.isCardFlipped) {
    flipper.classList.add('is-flipped');
  } else {
    flipper.classList.remove('is-flipped');
  }
}

let isPopulatingCard = false;

function markCardDirty() {
  if (isPopulatingCard) return;
  state.isCardDirty = true;
  const indicator = document.getElementById('cardSaveStatusIndicator');
  if (indicator) {
    indicator.className = "text-xs text-amber-400 font-bold flex items-center gap-1.5 animate-pulse";
    indicator.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-amber-400"></i><span>Modifiche non salvate</span>`;
    lucide.createIcons();
  }
}

function markCardClean() {
  state.isCardDirty = false;
  const indicator = document.getElementById('cardSaveStatusIndicator');
  if (indicator) {
    indicator.className = "text-xs text-slate-400 font-bold flex items-center gap-1.5";
    indicator.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i><span>Scheda Ufficiale Salvata</span>`;
    lucide.createIcons();
  }
}

function discardCardEdits() {
  if (state.savedProfile) {
    populateCardEditor(state.savedProfile);
  } else if (state.profile) {
    populateCardEditor(state.profile);
  }
  markCardClean();
}

function setCardTheme(theme) {
  SoundFX.playClick();
  const front = document.getElementById('cardFront');
  const back = document.getElementById('cardBack');
  const themes = ['theme-gold', 'theme-icon', 'theme-emerald', 'theme-neon', 'theme-panini'];
  themes.forEach(t => {
    front.classList.remove(t);
    back.classList.remove(t);
  });
  front.classList.add(`theme-${theme}`);
  back.classList.add(`theme-${theme}`);
  state.draftCardTheme = theme;
  markCardDirty();
}

function selectDrawnAvatar(svgPath) {
  SoundFX.playClick();
  const img = document.getElementById('cardPhotoDisplay');
  if (img) img.src = svgPath;
  state.draftPhotoUrl = svgPath;

  document.querySelectorAll('.avatar-option-card').forEach(c => c.classList.remove('selected'));
  const found = Array.from(document.querySelectorAll('.avatar-option-card img')).find(i => i.src.includes(svgPath));
  if (found && found.parentElement) found.parentElement.classList.add('selected');
  markCardDirty();
}

async function fetchUserProfile() {
  try {
    const playerId = getCurrentPlayerId();
    const res = await fetch(`/api/profile?player_id=${playerId}`);
    const p = await res.json();
    state.savedProfile = JSON.parse(JSON.stringify(p));
    state.profile = p;
    state.draftCardTheme = p.card_theme || 'gold';
    state.draftPhotoUrl = p.photo_url || '/static/avatars/bomber.svg';
    populateCardEditor(p);
    loadUserMatchHistory();
    refreshUserCoordinates();
  } catch (e) {
    console.error("Profile error:", e);
  }
}

function populateCardEditor(p) {
  if (!p) return;
  isPopulatingCard = true;

  document.getElementById('editName').value = p.name || '';
  document.getElementById('editNickname').value = p.nickname || '';
  document.getElementById('editPrimaryRole').value = p.primary_role || 'Centrocampista';
  document.getElementById('editFoot').value = p.foot || 'Destro';
  document.getElementById('editAge').value = p.age || 25;
  document.getElementById('editCity').value = p.city || '';
  document.getElementById('editPhone').value = p.phone || '';
  document.getElementById('editBio').value = p.bio || '';

  // Restore secondary roles checkboxes
  let secRoles = p.secondary_roles || [];
  if (typeof secRoles === 'string') {
    try { secRoles = JSON.parse(secRoles); } catch(e) { secRoles = []; }
  }
  document.querySelectorAll('.sec-role-cb').forEach(cb => {
    cb.checked = Array.isArray(secRoles) && secRoles.includes(cb.value);
  });

  // Restore badges checkboxes
  let userBadges = p.badges || [];
  if (typeof userBadges === 'string') {
    try { userBadges = JSON.parse(userBadges); } catch(e) { userBadges = []; }
  }
  document.querySelectorAll('.badge-cb').forEach(cb => {
    cb.checked = Array.isArray(userBadges) && userBadges.includes(cb.value);
  });

  ['vel', 'tir', 'pas', 'dri', 'dif', 'fis'].forEach(stat => {
    const val = p[`stats_${stat}`] !== undefined ? p[`stats_${stat}`] : 75;
    const r = document.getElementById(`range_${stat}`);
    const v = document.getElementById(`val_${stat}`);
    if (r) r.value = val;
    if (v) v.innerText = val;
  });

  const photo = p.photo_url || '/static/avatars/bomber.svg';
  const theme = p.card_theme || 'gold';
  state.draftPhotoUrl = photo;
  state.draftCardTheme = theme;
  selectDrawnAvatar(photo);
  setCardTheme(theme);

  document.getElementById('cardMatchesPlayedDisplay').innerText = p.matches_played || 0;
  document.getElementById('cardMvpDisplay').innerText = p.mvp_count || 0;
  document.getElementById('cardReliabilityPctDisplay').innerText = `${p.reliability_score || 100}%`;
  document.getElementById('cardReliabilityBadgeFront').innerText = `⭐ ${p.fair_play_rating || '5.0'} Persona • 🎯 ${p.card_accuracy_rating || '5.0'} Scheda`;
  const fairPlayBadge = document.getElementById('cardFairPlayRatingBadge');
  if (fairPlayBadge) fairPlayBadge.innerText = `⭐ ${p.fair_play_rating || '5.0'} FAIR PLAY`;
  const skillAccuracyBadge = document.getElementById('cardSkillAccuracyBadge');
  if (skillAccuracyBadge) skillAccuracyBadge.innerText = `🎯 ${p.card_accuracy_rating || '5.0'} SCHEDA VERA`;

  const followersDisplay = document.getElementById('cardFollowersDisplay');
  if (followersDisplay) {
    followersDisplay.innerText = p.followers_count || 0;
  }

  // Pre-fill organizer contacts in match creation if logged in
  if (state.currentUser) {
    const orgName = document.getElementById('createOrganizerName');
    const orgPhone = document.getElementById('createOrganizerPhone');
    if (orgName && !orgName.value) orgName.value = state.currentUser.full_name;
    if (orgPhone && state.currentUser.phone && !orgPhone.value) orgPhone.value = state.currentUser.phone;
  }

  updateCardLive();
  isPopulatingCard = false;
  markCardClean();
}

function onStatSliderChange(stat) {
  const range = document.getElementById(`range_${stat}`);
  const val = document.getElementById(`val_${stat}`);
  if (range && val) val.innerText = range.value;
  updateCardLive();
}

function updateCardLive() {
  markCardDirty();

  const name = document.getElementById('editName').value.trim() || 'TUO NOME';
  const nickname = document.getElementById('editNickname').value.trim() || '';
  const role = document.getElementById('editPrimaryRole').value || 'Centrocampista';
  const foot = document.getElementById('editFoot').value || 'Destro';
  const age = document.getElementById('editAge').value || '25';
  const city = document.getElementById('editCity').value.trim() || '';
  const phone = document.getElementById('editPhone').value.trim() || '';
  const bio = document.getElementById('editBio').value.trim() || '';

  const vel = parseInt(document.getElementById('range_vel').value);
  const tir = parseInt(document.getElementById('range_tir').value);
  const pas = parseInt(document.getElementById('range_pas').value);
  const dri = parseInt(document.getElementById('range_dri').value);
  const dif = parseInt(document.getElementById('range_dif').value);
  const fis = parseInt(document.getElementById('range_fis').value);

  let roleCode = "CC";
  if (role === "Portiere") roleCode = "PT";
  else if (role === "Difensore") roleCode = "DC";
  else if (role === "Attaccante") roleCode = "ATT";
  else if (role === "Jolly") roleCode = "JOL";

  let calculatedOvr = Math.round((vel + tir + pas + dri + dif + fis) / 6);
  if (role === "Portiere") calculatedOvr = Math.round(dif * 0.45 + fis * 0.3 + pas * 0.15 + vel * 0.1);
  else if (role === "Attaccante") calculatedOvr = Math.round(tir * 0.4 + vel * 0.25 + dri * 0.2 + fis * 0.15);
  else if (role === "Difensore") calculatedOvr = Math.round(dif * 0.45 + fis * 0.3 + vel * 0.15 + pas * 0.1);

  document.getElementById('cardOvrDisplay').innerText = calculatedOvr;
  document.getElementById('calculatedOvrBadge').innerText = calculatedOvr;
  document.getElementById('cardRoleDisplay').innerText = roleCode;
  document.getElementById('cardNameDisplay').innerText = name.toUpperCase();
  document.getElementById('cardNicknameDisplay').innerText = nickname ? `"${nickname}"` : '';
  document.getElementById('cardFootDisplay').innerText = foot === 'Destro' ? 'Dx' : (foot === 'Sinistro' ? 'Sx' : 'Amb');
  document.getElementById('cardAgeDisplay').innerText = `${age} anni`;
  document.getElementById('cardCityDisplay').innerText = city || '-';

  document.getElementById('cardVelDisplay').innerText = vel;
  document.getElementById('cardTirDisplay').innerText = tir;
  document.getElementById('cardPasDisplay').innerText = pas;
  document.getElementById('cardDriDisplay').innerText = dri;
  document.getElementById('cardDifDisplay').innerText = dif;
  document.getElementById('cardFisDisplay').innerText = fis;

  document.getElementById('cardBackNameDisplay').innerText = name.toUpperCase();
  document.getElementById('cardBackBioDisplay').innerText = bio ? `"${bio}"` : `"Pronto a scendere in campo e dare il massimo!"`;
  
  const waClean = phone.replace(/[^0-9]/g, '');
  document.getElementById('cardWhatsAppLink').href = `https://wa.me/${waClean}?text=Ciao!%20Ho%20visto%20la%20tua%20scheda%20su%20Trova%20l'Ultimo,%20giochi%20con%20noi%20stasera?`;

  const selectedBadges = [];
  document.querySelectorAll('.badge-cb:checked').forEach(cb => selectedBadges.push(cb.value));

  const badgesPreview = document.getElementById('cardBadgesPreview');
  const backBadgesList = document.getElementById('cardBackBadgesList');
  if (badgesPreview && backBadgesList) {
    badgesPreview.innerHTML = selectedBadges.slice(0, 3).map(b => `
      <span class="bg-black/90 text-amber-300 border border-amber-400/50 text-[10px] px-2 py-0.5 rounded-full font-black">
        ${b.split(' ')[0]} ${b.split(' ')[1] || ''}
      </span>
    `).join('');

    backBadgesList.innerHTML = selectedBadges.map(b => `
      <div class="flex items-center gap-1.5 text-amber-200">
        <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 flex-shrink-0"></i>
        <span>${b}</span>
      </div>
    `).join('');
    lucide.createIcons();
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => selectDrawnAvatar(e.target.result);
    reader.readAsDataURL(file);
  }
}

async function savePlayerProfile() {
  if (!state.currentUser) {
    requireAuthAndExecute(() => savePlayerProfile());
    return;
  }

  SoundFX.playWhistle();

  const badges = [];
  document.querySelectorAll('.badge-cb:checked').forEach(cb => badges.push(cb.value));

  const secondary = [];
  document.querySelectorAll('.sec-role-cb:checked').forEach(cb => secondary.push(cb.value));

  if (!state.currentUser) {
    requireAuthAndExecute(() => savePlayerCard());
    return;
  }
  const playerId = getCurrentPlayerId();

  const payload = {
    name: document.getElementById('editName').value,
    nickname: document.getElementById('editNickname').value,
    photo_url: state.draftPhotoUrl || document.getElementById('cardPhotoDisplay').src,
    age: parseInt(document.getElementById('editAge').value),
    foot: document.getElementById('editFoot').value,
    primary_role: document.getElementById('editPrimaryRole').value,
    secondary_roles: secondary,
    city: document.getElementById('editCity').value,
    bio: document.getElementById('editBio').value,
    phone: document.getElementById('editPhone').value,
    stats_vel: parseInt(document.getElementById('range_vel').value),
    stats_tir: parseInt(document.getElementById('range_tir').value),
    stats_pas: parseInt(document.getElementById('range_pas').value),
    stats_dri: parseInt(document.getElementById('range_dri').value),
    stats_dif: parseInt(document.getElementById('range_dif').value),
    stats_fis: parseInt(document.getElementById('range_fis').value),
    ovr: parseInt(document.getElementById('calculatedOvrBadge').innerText),
    card_theme: state.draftCardTheme || state.savedProfile?.card_theme || 'gold',
    badges: badges,
    is_available: 1
  };

  try {
    const res = await fetch(`/api/profile?player_id=${playerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      alert("Scheda Giocatore salvata con successo!");
      state.savedProfile = JSON.parse(JSON.stringify(payload));
      state.profile = JSON.parse(JSON.stringify(payload));
      markCardClean();
    }
  } catch (e) {
    alert("Errore nel salvataggio della scheda.");
  }
}

function shareMyCard() {
  SoundFX.playClick();
  const p = state.profile || {
    name: document.getElementById('editName').value,
    primary_role: document.getElementById('editPrimaryRole').value,
    ovr: document.getElementById('calculatedOvrBadge').innerText
  };

  const text = `⚽ Ecco la mia Scheda Giocatore su Trova l'Ultimo!\n👤 ${p.name}\n⭐ Overall Rating: ${p.ovr} OVR\n🧤 Ruolo: ${p.primary_role}\n🛡️ Zero Pacchi e 100% Affidabile!\nMai più con uno in meno!`;
  
  if (navigator.share) {
    navigator.share({ title: "La mia Scheda Trova l'Ultimo", text: text, url: window.location.href }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text);
    alert("Dati della scheda copiati negli appunti!");
  }
}

// ----------------------------------------------------
// WHATSAPP SOS GENERATOR (UTILITY)
// ----------------------------------------------------
function generateSosMessage() {
  const formatEl = document.getElementById('sosFormat');
  if (!formatEl) return;
  const format = formatEl.value;
  const role = document.getElementById('sosRole')?.value || '';
  const time = document.getElementById('sosTime')?.value || '';
  const field = document.getElementById('sosField')?.value || '';
  const price = document.getElementById('sosPrice')?.value || '';

  const msg = 
`🚨 *EMERGENZA CALCETTO: CERCASI L'ULTIMO UOMO!* 🚨
*Mai più con uno in meno!*

Ragazzi ci ha dato buca uno all'ultimo! 😱
Ci serve disperatamente *${role}* per completare le squadre!

📅 *Quando:* ${time}
📍 *Dove:* ${field}
⚽ *Formato:* ${format}
💰 *Quota:* ${price}

👉 Chi c'è o chi ha un amico che gioca?
Rispondete subito qui nel gruppo o in privato! 🙏⚽`;

  const output = document.getElementById('sosOutputText');
  if (output) output.value = msg;
}

function copySosText() {
  const output = document.getElementById('sosOutputText');
  if (!output) return;
  output.select();
  navigator.clipboard.writeText(output.value);
  const btnText = document.getElementById('copyBtnText');
  if (btnText) {
    btnText.innerText = "COPIATO!";
    setTimeout(() => btnText.innerText = "Copia Testo SOS", 2000);
  }
}

function openWhatsAppWebWithSos() {
  const output = document.getElementById('sosOutputText');
  if (!output) return;
  const text = output.value;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function shareMatchWhatsApp(matchId) {
  SoundFX.playClick();
  const match = state.matches.find(m => m.id === matchId);
  if (!match) return;

  const text = 
`🚨 *CERCASI ULTIMO UOMO PER STASERA!*
*Mai più con uno in meno*
⚽ ${match.title}
📍 ${match.field_name} (${match.city})
⏰ ${match.match_date} ore ${match.match_time}
🧤 Manca: ${match.roles_needed.join(', ')}
💰 Quota: ${match.price_per_player}
📞 Organizzatore: ${match.organizer_name} (${match.organizer_phone})

Candidati subito su Trova l'Ultimo: ${window.location.origin}`;

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// ----------------------------------------------------
// ADMIN DASHBOARD
// ----------------------------------------------------
function switchAdminSubTab(subTab) {
  SoundFX.playClick();
  document.getElementById('adminPaneMatches').classList.add('hidden');
  document.getElementById('adminPaneReviews').classList.add('hidden');
  document.getElementById('adminPaneUsers').classList.add('hidden');
  document.getElementById('adminPaneSettings').classList.add('hidden');

  document.getElementById('admin-sub-matches').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition";
  document.getElementById('admin-sub-reviews').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition";
  document.getElementById('admin-sub-users').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition";
  document.getElementById('admin-sub-settings').className = "px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition";

  if (subTab === 'matches') {
    document.getElementById('adminPaneMatches').classList.remove('hidden');
    document.getElementById('admin-sub-matches').className = "px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 transition";
  } else if (subTab === 'reviews') {
    document.getElementById('adminPaneReviews').classList.remove('hidden');
    document.getElementById('admin-sub-reviews').className = "px-4 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 transition";
  } else if (subTab === 'users') {
    document.getElementById('adminPaneUsers').classList.remove('hidden');
    document.getElementById('admin-sub-users').className = "px-4 py-2 rounded-xl text-xs font-black bg-sky-400 text-slate-950 transition";
  } else if (subTab === 'settings') {
    document.getElementById('adminPaneSettings').classList.remove('hidden');
    document.getElementById('admin-sub-settings').className = "px-4 py-2 rounded-xl text-xs font-black bg-emerald-400 text-slate-950 transition";
  }
}

async function loadAdminData() {
  try {
    const res = await fetch('/api/admin/overview');
    const data = await res.json();

    document.getElementById('adminTotalMatches').innerText = data.total_matches || 0;
    document.getElementById('adminTotalReviews').innerText = data.total_reviews || 0;
    document.getElementById('adminTotalUsers').innerText = data.total_users || 0;

    const mBody = document.getElementById('adminMatchesTableBody');
    mBody.innerHTML = (data.matches || []).map(m => `
      <tr class="hover:bg-slate-900/60">
        <td class="py-3 font-mono text-slate-400">#${m.id}</td>
        <td class="font-bold text-white">${m.title}<br><span class="text-[10px] text-slate-400 font-normal">${m.field_name} (${m.city})</span></td>
        <td>
          <div class="font-bold text-white">${m.match_date}</div>
          <div class="text-[10px] text-emerald-400 font-mono">ore ${m.match_time}${m.end_time ? ' - ' + m.end_time : ''}</div>
        </td>
        <td><span class="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">A ${m.format}</span></td>
        <td>
          ${(m.status === 'filled' || m.missing_count === 0) 
            ? `<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">Completa (0)</span>` 
            : `<span class="text-rose-400 font-bold">${m.missing_count} uomo/i</span>`
          }
        </td>
        <td>${m.organizer_name} (${m.organizer_phone})</td>
        <td class="text-right">
          <button onclick="adminDeleteMatch(${m.id})" class="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-xs font-bold transition">
            🗑️ Elimina Partita
          </button>
        </td>
      </tr>
    `).join('');

    const rBody = document.getElementById('adminReviewsTableBody');
    rBody.innerHTML = (data.reviews || []).map(r => `
      <tr class="hover:bg-slate-900/60">
        <td class="py-3 font-bold text-white">${r.reviewer_name}</td>
        <td class="text-slate-300 font-medium">
          <div class="font-bold text-white">${r.target_player_name || r.target_player_id}</div>
          <div class="text-[10px] text-slate-400 font-mono">${r.match_title || 'Calcetto'}</div>
        </td>
        <td class="text-amber-400 font-black">⭐ ${r.rating_person || r.rating || 5}/5</td>
        <td class="text-emerald-400 font-black">🎯 ${r.rating_skill || 5}/5</td>
        <td><span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold">${r.reliability_tag || 'Affidabile'}</span></td>
        <td class="italic text-slate-300">"${r.comment || ''}"</td>
        <td class="text-right">
          <button onclick="adminDeleteReview(${r.id})" class="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-xs font-bold transition">
            🗑️ Rimuovi
          </button>
        </td>
      </tr>
    `).join('');

    const uBody = document.getElementById('adminUsersTableBody');
    if (uBody) {
      uBody.innerHTML = (data.users || []).map(u => {
        const waClean = (u.phone || '').replace(/[^0-9]/g, '');
        const waLink = waClean ? `https://wa.me/${waClean}` : '#';
        const isAdmin = Boolean(u.is_admin);
        return `
          <tr class="hover:bg-slate-900/60 transition-colors">
            <td class="py-3 flex items-center gap-3">
              <img src="${u.photo_url || '/static/avatars/bomber.svg'}" class="w-9 h-9 rounded-xl object-contain bg-slate-950 border border-slate-700 p-0.5" alt="${u.full_name}">
              <div>
                <div class="font-bold text-white leading-tight">${u.full_name}</div>
                <div class="text-[11px] text-slate-400 font-mono">@${u.username}</div>
              </div>
            </td>
            <td>
              <div class="font-bold text-slate-200">${u.primary_role}</div>
              <div class="text-[11px] text-slate-400">${u.city}</div>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <span class="font-mono text-emerald-400 font-bold">${u.phone || 'Non indicato'}</span>
                ${waClean ? `
                  <a href="${waLink}" target="_blank" class="p-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-slate-950 transition" title="Contatta su WhatsApp">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  </a>
                ` : ''}
              </div>
              <div class="text-[10px] text-slate-400 truncate max-w-[150px]">${u.email || ''}</div>
            </td>
            <td>
              <span class="px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-400/40 text-amber-300 font-black text-xs font-bebas tracking-wide">
                ${u.ovr} OVR
              </span>
            </td>
            <td>
              <span class="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                ⭐ ${u.fair_play_rating || '5.0'} (${u.reliability_score || 100}%)
              </span>
            </td>
            <td>
              <span class="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                🎯 ${u.card_accuracy_rating || '5.0'} Fedeltà
              </span>
            </td>
            <td>
              <span class="font-mono font-bold text-white">${u.matches_played || 0}</span>
              <span class="text-[10px] text-slate-400"> giocate</span>
            </td>
            <td>
              ${isAdmin 
                ? `<span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase">Admin</span>` 
                : `<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">Giocatore</span>`
              }
            </td>
            <td class="text-right">
              ${!isAdmin ? `
                <button onclick="adminDeleteUser(${u.id}, '${u.username}')" class="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-xs font-bold transition">
                  🗑️ Elimina Utente
                </button>
              ` : `
                <span class="text-slate-500 text-[10px] italic font-bold">Protetto</span>
              `}
            </td>
          </tr>
        `;
      }).join('');
    }

    const settings = data.settings || {};
    if (settings.broadcast_alert) document.getElementById('adminBroadcastInput').value = settings.broadcast_alert;
    if (settings.emergency_threshold_hours) document.getElementById('adminThresholdInput').value = settings.emergency_threshold_hours;
    if (settings.allowed_formats) document.getElementById('adminFormatsInput').value = settings.allowed_formats;
    if (settings.active_cities) document.getElementById('adminCitiesInput').value = settings.active_cities;

    lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

async function adminDeleteMatch(id) {
  if (!confirm(`Sei sicuro di voler eliminare la partita #${id}?`)) return;
  SoundFX.playWhistle();
  try {
    const res = await fetch(`/api/admin/matches/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    loadAdminData();
    fetchMatches();
  } catch (err) {
    alert("Errore nella cancellazione.");
  }
}

async function adminDeleteReview(id) {
  if (!confirm(`Sei sicuro di voler rimuovere la recensione #${id}?`)) return;
  SoundFX.playClick();
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    loadAdminData();
    fetchUserProfile();
  } catch (err) {
    alert("Errore nella cancellazione.");
  }
}

async function adminDeleteUser(userId, username) {
  if (!confirm(`Sei sicuro di voler eliminare l'utente @${username} (ID #${userId})?\n\nQuesta operazione rimuoverà definitivamente la sua scheda giocatore, le sue disponibilità e candidature a sistema.`)) return;
  SoundFX.playWhistle();
  try {
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Errore nella cancellazione utente');
    alert(data.message);
    loadAdminData();
  } catch (err) {
    alert(err.message);
  }
}

async function saveAdminSettings() {
  SoundFX.playWhistle();
  const payload = {
    broadcast_alert: document.getElementById('adminBroadcastInput').value,
    emergency_threshold_hours: document.getElementById('adminThresholdInput').value,
    allowed_formats: document.getElementById('adminFormatsInput').value,
    active_cities: document.getElementById('adminCitiesInput').value
  };

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    confetti({ particleCount: 60, spread: 50 });
    alert("Impostazioni salvate!");
    const ticker = document.getElementById('urgentTickerText');
    if (ticker && payload.broadcast_alert) ticker.innerText = payload.broadcast_alert;
  } catch (err) {
    alert("Errore nel salvataggio.");
  }
}

// ----------------------------------------------------
// NOTIFICATIONS & CONSTRUCTIVE CARD ADVICE
// ----------------------------------------------------
// ----------------------------------------------------
// NOTIFICATIONS & PWA PUSH SYSTEM
// ----------------------------------------------------
state.notifications = [];
state.knownNotificationIds = new Set();
state.notificationsFirstLoad = true;
let activeToastTimeout = null;

async function requestNotificationPermission() {
  SoundFX.playClick();
  if (!('Notification' in window)) {
    alert("Le notifiche non sono supportate da questo browser.");
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    updateNotificationPermissionUI();
    if (permission === 'granted') {
      triggerSystemNotification(
        "Trova l'Ultimo ⚽",
        "Notifiche attivate con successo! Riceverai avvisi immediati per candidature, chat e convocazioni.",
        { type: 'test' }
      );
    }
  } catch (err) {
    console.error("Errore richiesta permessi notifiche:", err);
  }
}

function updateNotificationPermissionUI() {
  const banner = document.getElementById('browserNotificationPromptBanner');
  if (!banner) return;

  if (!('Notification' in window)) {
    banner.classList.add('hidden');
    return;
  }

  if (Notification.permission === 'granted') {
    banner.className = "p-3 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between gap-3 text-xs flex-shrink-0";
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-emerald-400 font-bold">✅ Notifiche telefono attive</span>
      </div>
      <span class="text-[10px] text-emerald-300 font-mono">ATTIVE</span>
    `;
  } else if (Notification.permission === 'denied') {
    banner.className = "p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs flex-shrink-0";
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-slate-400 text-xs">Notifiche bloccate nelle impostazioni del browser</span>
      </div>
    `;
  } else {
    banner.classList.remove('hidden');
  }
}

function triggerSystemNotification(title, body, data) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: title,
        body: body,
        data: data || {}
      });
    } else {
      new Notification(title, {
        body: body,
        icon: '/static/icons/icon-192x192.png',
        badge: '/static/icons/icon-192x192.png',
        tag: data?.type || 'trova_notif'
      });
    }
  } catch (e) {
    console.log("System notification error:", e);
  }
}

function showInAppNotificationToast(notif) {
  const toast = document.getElementById('inAppNotificationToast');
  if (!toast) return;

  clearTimeout(activeToastTimeout);

  const titleEl = document.getElementById('inAppToastTitle');
  const msgEl = document.getElementById('inAppToastMessage');
  const iconEl = document.getElementById('inAppToastIcon');
  const cardEl = document.getElementById('inAppToastCard');

  let icon = '🔔';
  if (notif.type === 'match_application') icon = '✋';
  else if (notif.type === 'scout_chat' || notif.type === 'chat_message') icon = '💬';
  else if (notif.type === 'match_confirmation') icon = '🎉';
  else if (notif.type === 'match_review_reminder') icon = '⭐';
  else if (notif.type === 'card_adjustment_advice') icon = '⚠️';
  else if (notif.type === 'new_follower') icon = '👥';

  if (iconEl) iconEl.innerText = icon;
  if (titleEl) titleEl.innerText = notif.title || 'Nuova notifica';
  if (msgEl) msgEl.innerText = notif.message || '';

  if (cardEl) {
    cardEl.onclick = () => {
      dismissNotificationToast();
      handleNotificationClick(notif);
    };
  }

  SoundFX.playWhistle();

  toast.classList.remove('hidden', '-translate-y-4');
  toast.classList.add('translate-y-0');

  activeToastTimeout = setTimeout(() => {
    dismissNotificationToast();
  }, 5500);
}

function dismissNotificationToast(e) {
  if (e) e.stopPropagation();
  const toast = document.getElementById('inAppNotificationToast');
  if (!toast) return;
  toast.classList.add('-translate-y-4');
  setTimeout(() => toast.classList.add('hidden'), 300);
}

async function fetchUserNotifications() {
  if (!state.currentUser) {
    updateNotificationBadges(0);
    return;
  }
  const userId = state.currentUser.player_id || state.currentUser.username || `user_${state.currentUser.id}`;
  try {
    const res = await fetch(`/api/notifications?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();
    const notifs = data.notifications || [];
    state.notifications = notifs;

    const unreadCount = data.unread_count !== undefined ? data.unread_count : notifs.filter(n => !n.is_read).length;
    updateNotificationBadges(unreadCount);

    // Detect brand new notifications for push & in-app alerts
    if (!state.notificationsFirstLoad) {
      notifs.forEach(n => {
        if (!n.is_read && !state.knownNotificationIds.has(n.id)) {
          triggerSystemNotification(n.title, n.message, n);
          showInAppNotificationToast(n);
        }
      });
    }

    // Populate known IDs
    notifs.forEach(n => state.knownNotificationIds.add(n.id));
    state.notificationsFirstLoad = false;

    // Check advice banner on card tab
    checkPlayerNotifications();
  } catch (err) {
    console.error("Notifications fetch error:", err);
  }
}

function updateNotificationBadges(unreadCount) {
  const headerBadge = document.getElementById('headerNotificationsBadge');
  if (headerBadge) {
    if (unreadCount > 0) {
      headerBadge.innerText = unreadCount > 9 ? '9+' : unreadCount;
      headerBadge.classList.remove('hidden');
    } else {
      headerBadge.classList.add('hidden');
    }
  }

  const footerCount = document.getElementById('notificationsFooterCount');
  if (footerCount) {
    footerCount.innerText = `${state.notifications.length} notifiche (${unreadCount} non lette)`;
  }
}

function openNotificationsModal() {
  SoundFX.playClick();
  if (typeof closePitchModal === 'function') closePitchModal();
  if (typeof closeFeedbackModal === 'function') closeFeedbackModal();
  if (typeof closeMatchApplicationsModal === 'function') closeMatchApplicationsModal();
  if (typeof closeAvailabilityModal === 'function') closeAvailabilityModal();
  const modal = document.getElementById('notificationsModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  updateNotificationPermissionUI();
  renderNotificationsList();
}

function closeNotificationsModal() {
  const modal = document.getElementById('notificationsModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function renderNotificationsList() {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="lock" class="w-10 h-10 mx-auto text-amber-400 mb-2 opacity-60"></i>
        <h4 class="text-white font-bold text-sm">Accedi per vedere le tue notifiche</h4>
        <p class="text-xs text-slate-400 mt-1">Effettua il login o registrati per ricevere avvisi su partite e messaggi.</p>
        <button onclick="closeNotificationsModal(); openAuthModal()" class="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
          Accedi / Registrati
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  if (!state.notifications.length) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400">
        <i data-lucide="bell-off" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
        <h4 class="text-white font-bold text-sm">Nessuna notifica al momento</h4>
        <p class="text-xs text-slate-400 mt-1">Quando qualcuno si candiderà alle tue partite, ti scriverà in chat o confermerà la tua presenza, troverai qui gli avvisi!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = state.notifications.map(n => {
    let icon = 'bell';
    let iconColor = 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    let actionBtnHtml = '';

    if (n.type === 'match_application') {
      icon = 'user-plus';
      iconColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      if (n.match_id) {
        actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition shadow">👥 Gestisci Candidati</button>`;
      }
    } else if (n.type === 'scout_chat' || n.type === 'chat_message') {
      icon = 'message-circle';
      iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition shadow">💬 Rispondi in Chat</button>`;
    } else if (n.type === 'match_confirmation') {
      icon = 'check-circle-2';
      iconColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      if (n.match_id) {
        actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition shadow">⚽ Campetto Partita</button>`;
      }
    } else if (n.type === 'match_review_reminder') {
      icon = 'star';
      iconColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      if (n.match_id) {
        actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] transition shadow">⭐ Valuta Giocatori</button>`;
      }
    } else if (n.type === 'card_adjustment_advice') {
      icon = 'sliders';
      iconColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition shadow">🎴 Apri Scheda</button>`;
    } else if (n.type === 'new_follower') {
      icon = 'users';
      iconColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      if (n.sender_id) {
        actionBtnHtml = `<button onclick="handleNotificationClickById(${n.id})" class="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] transition shadow">👁️ Scheda 3D</button>`;
      }
    }

    const unreadBg = !n.is_read ? 'bg-slate-900/90 border-slate-700/80 ring-1 ring-amber-400/40' : 'bg-slate-950/60 border-slate-800/60';
    const dateFormatted = n.created_at ? n.created_at.slice(0, 16).replace('T', ' ') : '';

    return `
      <div class="p-3 rounded-2xl border ${unreadBg} flex flex-col gap-2 transition hover:border-slate-700">
        <div class="flex items-start justify-between gap-2.5">
          <div class="flex items-start gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-xl ${iconColor} border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <i data-lucide="${icon}" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h5 class="text-xs font-bold text-white leading-snug">${n.title}</h5>
                ${!n.is_read ? `<span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>` : ''}
              </div>
              <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">${n.message}</p>
              ${dateFormatted ? `<span class="text-[9px] text-slate-500 mt-1 block font-mono">${dateFormatted}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
          <div>${actionBtnHtml}</div>
          ${!n.is_read ? `
            <button onclick="markNotificationRead(${n.id})" class="text-[10px] text-slate-400 hover:text-white underline font-semibold transition">
              Segna letta
            </button>
          ` : `
            <span class="text-[9px] text-slate-600 font-medium">Letta ✓</span>
          `}
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

async function markNotificationRead(notifId) {
  try {
    await fetch(`/api/notifications/${notifId}/read`, { method: 'POST' });
    const target = state.notifications.find(n => n.id === notifId);
    if (target) target.is_read = 1;
    updateNotificationBadges(state.notifications.filter(n => !n.is_read).length);
    renderNotificationsList();
  } catch (e) {
    console.error(e);
  }
}

async function markAllNotificationsRead() {
  if (!state.currentUser) return;
  const userId = state.currentUser.player_id || state.currentUser.username || `user_${state.currentUser.id}`;
  try {
    await fetch(`/api/notifications/read_all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    state.notifications.forEach(n => n.is_read = 1);
    updateNotificationBadges(0);
    renderNotificationsList();
  } catch (e) {
    console.error(e);
  }
}

function handleNotificationClickById(notifId) {
  const notif = state.notifications.find(n => n.id === notifId);
  if (notif) handleNotificationClick(notif);
}

async function handleNotificationClick(notif) {
  await markNotificationRead(notif.id);
  closeNotificationsModal();

  if (notif.type === 'match_application') {
    if (notif.match_id) openMatchApplicationsModal(notif.match_id);
  } else if (notif.type === 'scout_chat' || notif.type === 'chat_message') {
    switchTab('chat');
    if (notif.sender_id && typeof openChatWithUser === 'function') {
      openChatWithUser(notif.sender_id, notif.sender_name);
    }
  } else if (notif.type === 'match_confirmation') {
    if (notif.match_id) openPitchModal(notif.match_id);
  } else if (notif.type === 'match_review_reminder') {
    if (notif.match_id) openReviewModalForMatch(notif.match_id);
  } else if (notif.type === 'card_adjustment_advice') {
    goToCardToReviewNotice();
  } else if (notif.type === 'new_follower') {
    if (notif.sender_id) {
      openInspectPlayerCard(notif.sender_id);
    }
  }
}

async function checkPlayerNotifications() {
  if (!state.currentUser) {
    const banner = document.getElementById('cardAdviceBanner');
    if (banner) banner.classList.add('hidden');
    return;
  }
  const notifs = state.notifications || [];
  const unreadAdvice = notifs.find(n => n.type === 'card_adjustment_advice' && !n.is_read);

  const banner = document.getElementById('cardAdviceBanner');
  if (unreadAdvice && banner) {
    state.activeCardAdviceNotification = unreadAdvice;
    const titleEl = document.getElementById('cardAdviceMatchTitle');
    const headerEl = document.getElementById('cardAdviceHeader');
    const msgEl = document.getElementById('cardAdviceMessage');

    if (titleEl) titleEl.innerText = unreadAdvice.match_title || 'Ultima Partita';
    if (headerEl) headerEl.innerText = unreadAdvice.title || "L'organizzatore ha suggerito di calibrare la tua scheda!";
    if (msgEl) msgEl.innerText = unreadAdvice.message || "Rivedi le tue statistiche su 'La Mia Scheda' per mantenere alta la tua affidabilità.";

    banner.classList.remove('hidden');
    lucide.createIcons();
  } else if (banner) {
    banner.classList.add('hidden');
  }
}

function goToCardToReviewNotice() {
  SoundFX.playClick();
  switchTab('card');
  if (state.activeCardAdviceNotification) {
    alert(`💡 Consiglio dall'Organizzatore:\n\n${state.activeCardAdviceNotification.message}\n\nPuoi regolare i cursori delle tue statistiche e cliccare 'SALVA SCHEDA GIOCATORE'.`);
  }
}

async function dismissCardAdvice() {
  SoundFX.playClick();
  const banner = document.getElementById('cardAdviceBanner');
  if (banner) banner.classList.add('hidden');
  if (state.activeCardAdviceNotification) {
    try {
      await fetch(`/api/notifications/${state.activeCardAdviceNotification.id}/read`, { method: 'POST' });
    } catch (e) {}
    state.activeCardAdviceNotification = null;
  }
}

// ==========================================
// SOCIAL COMMUNITY & PLAYER SEARCH FUNCTIONS
// ==========================================
let playerSearchDebounceTimer = null;

function renderPlayerSearchPrompt() {
  const container = document.getElementById('playerSearchResults');
  if (!container) return;
  container.innerHTML = `
    <div class="py-14 text-center glass-panel rounded-2xl border border-slate-800/80 p-6">
      <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
        <i data-lucide="search" class="w-6 h-6"></i>
      </div>
      <h5 class="text-white font-bold text-sm">Cerca un Giocatore</h5>
      <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
        Inizia a digitare il nome, cognome o @username per visualizzare i profili correlati e aprire la loro carta 3D.
      </p>
    </div>
  `;
  lucide.createIcons();
}

function openPlayerSearchModal() {
  SoundFX.playClick();
  // Se l'utente non ha effettuato l'accesso, blocca la ricerca e richiedi il login o la registrazione
  if (!state.currentUser) {
    showNotificationToast(
      "Accesso Richiesto", 
      "Devi avere un account ed effettuare l'accesso per cercare gli altri giocatori!", 
      "warning"
    );
    state.pendingActionAfterAuth = () => openPlayerSearchModal();
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('playerSearchModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  const input = document.getElementById('playerSearchInput');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 100);
  }
  const clearBtn = document.getElementById('clearPlayerSearchBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderPlayerSearchPrompt();
}

function closePlayerSearchModal() {
  SoundFX.playClick();
  const modal = document.getElementById('playerSearchModal');
  if (modal) modal.classList.add('hidden');
}

function clearPlayerSearch() {
  const input = document.getElementById('playerSearchInput');
  if (input) {
    input.value = '';
    input.focus();
  }
  const clearBtn = document.getElementById('clearPlayerSearchBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderPlayerSearchPrompt();
}

function debouncePlayerSearch() {
  if (!state.currentUser) {
    openPlayerSearchModal();
    return;
  }
  const input = document.getElementById('playerSearchInput');
  const clearBtn = document.getElementById('clearPlayerSearchBtn');
  const query = (input ? input.value : '').trim();

  if (clearBtn) {
    if (query) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  clearTimeout(playerSearchDebounceTimer);

  if (!query) {
    renderPlayerSearchPrompt();
    return;
  }

  playerSearchDebounceTimer = setTimeout(() => {
    searchPlayers(query);
  }, 200);
}

async function searchPlayers(query) {
  const container = document.getElementById('playerSearchResults');
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `
      <div class="py-12 text-center glass-panel rounded-2xl border border-amber-500/40 p-6">
        <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="lock" class="w-6 h-6"></i>
        </div>
        <h5 class="text-white font-bold text-sm">Accesso Riservato</h5>
        <p class="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
          Devi registrarti o accedere con il tuo account per cercare i giocatori.
        </p>
        <button onclick="closePlayerSearchModal(); openAuthModal('login')" class="mt-4 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-lg shadow-cyan-500/25">
          Accedi o Registrati
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const trimmed = (query || '').trim();
  if (!trimmed) {
    renderPlayerSearchPrompt();
    return;
  }

  container.innerHTML = `
    <div class="py-8 text-center text-slate-400">
      <div class="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p class="text-xs">Ricerca profili correlati in corso...</p>
    </div>
  `;

  try {
    const viewerId = state.currentUser.player_id || ('user_' + state.currentUser.id) || state.currentUser.username;
    const res = await fetch(`/api/search/players?q=${encodeURIComponent(trimmed)}&viewer_id=${encodeURIComponent(viewerId)}`);
    
    if (res.status === 401) {
      const errData = await res.json().catch(() => ({}));
      container.innerHTML = `
        <div class="py-12 text-center glass-panel rounded-2xl border border-amber-500/40 p-6">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
            <i data-lucide="lock" class="w-6 h-6"></i>
          </div>
          <h5 class="text-white font-bold text-sm">Accesso Richiesto</h5>
          <p class="text-xs text-slate-300 mt-1 max-w-xs mx-auto">${errData.detail || "Effettua l'accesso per effettuare ricerche."}</p>
          <button onclick="closePlayerSearchModal(); openAuthModal('login')" class="mt-4 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-lg shadow-cyan-500/25">
            Accedi o Registrati
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const data = await res.json();
    const players = data.players || [];

    if (!players.length) {
      container.innerHTML = `
        <div class="py-10 text-center glass-panel rounded-2xl border border-slate-800 p-4">
          <i data-lucide="user-x" class="w-8 h-8 text-slate-500 mx-auto mb-1.5"></i>
          <h5 class="text-white font-bold text-sm">Nessun giocatore trovato</h5>
          <p class="text-xs text-slate-400 mt-1">Nessun calciatore corrisponde a "${trimmed}". Prova con un altro nome o username.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = players.map(p => {
      const isMe = state.currentUser && (
        p.id === state.currentUser.player_id || 
        p.id === 'user_' + state.currentUser.id || 
        p.linked_username === state.currentUser.username ||
        (p.name && state.currentUser.full_name && p.name.toLowerCase() === state.currentUser.full_name.toLowerCase())
      );
      const usernameLabel = p.linked_username ? `@${p.linked_username}` : (p.nickname || '@giocatore');
      const isFollowing = Boolean(p.is_following);
      const followersCount = p.followers_count || 0;

      return `
        <div class="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition flex items-center justify-between gap-3 group">
          
          <!-- Avatar + Info -->
          <div class="flex items-center gap-3 min-w-0 cursor-pointer" onclick="openInspectPlayerCard('${p.id}')">
            <div class="relative flex-shrink-0">
              <img src="${p.photo_url || '/static/avatars/bomber.svg'}" class="w-12 h-12 rounded-xl object-cover border border-amber-300/50 bg-slate-950 shadow-md">
              <span class="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] font-bebas">
                ${p.ovr || 75}
              </span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <h5 class="font-bold text-white text-sm truncate group-hover:text-cyan-300 transition">${p.name || 'Giocatore'}</h5>
                <span class="text-[10px] font-mono text-cyan-400 font-medium">${usernameLabel}</span>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span class="font-semibold text-amber-300">${p.primary_role || 'Jolly'}</span>
                <span>•</span>
                <span class="flex items-center gap-0.5 text-slate-300">
                  <i data-lucide="users" class="w-3 h-3 text-cyan-400"></i>
                  <span id="playerSearchFollowers_${p.id}">${followersCount}</span> follow
                </span>
                ${p.city ? `<span>•</span><span>📍 ${p.city}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button onclick="openInspectPlayerCard('${p.id}')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1 border border-slate-700" title="Vedi Scheda Tecnica 3D">
              <i data-lucide="eye" class="w-3.5 h-3.5 text-amber-400"></i>
              <span class="hidden sm:inline">Scheda</span>
            </button>

            ${!isMe ? `
              <button 
                id="searchFollowBtn_${p.id}" 
                onclick="toggleFollowPlayer('${p.id}', this)" 
                class="px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm ${isFollowing ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'}"
              >
                <i data-lucide="${isFollowing ? 'check' : 'user-plus'}" class="w-3.5 h-3.5"></i>
                <span>${isFollowing ? 'Seguito' : 'Segui'}</span>
              </button>
            ` : `
              <span class="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">Tu</span>
            `}
          </div>

        </div>
      `;
    }).join('');

    lucide.createIcons();
  } catch (err) {
    console.error('Search error:', err);
    container.innerHTML = `
      <div class="py-6 text-center text-rose-400 text-xs">
        Errore durante la ricerca giocatori. Riprova.
      </div>
    `;
  }
}

async function toggleFollowPlayer(playerId, btnElement) {
  if (!state.currentUser) {
    showNotificationToast("Accesso Richiesto", "Accedi o registrati per seguire i tuoi compagni di calcetto!", "error");
    openAuthModal();
    return;
  }

  SoundFX.playClick();
  const followerId = state.currentUser.player_id || ('user_' + state.currentUser.id) || state.currentUser.username;

  try {
    const res = await fetch(`/api/players/${playerId}/toggle-follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId })
    });
    const data = await res.json();

    if (!res.ok) {
      showNotificationToast("Attenzione", data.detail || "Impossibile completare l'azione.", "error");
      return;
    }

    const searchBtn = btnElement || document.getElementById(`searchFollowBtn_${playerId}`);
    if (searchBtn) {
      if (data.is_following) {
        searchBtn.className = "px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50";
        searchBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Seguito</span>`;
      } else {
        searchBtn.className = "px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 shadow-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25";
        searchBtn.innerHTML = `<i data-lucide="user-plus" class="w-3.5 h-3.5"></i><span>Segui</span>`;
      }
    }

    const countElem = document.getElementById(`playerSearchFollowers_${playerId}`);
    if (countElem) countElem.innerText = data.followers_count;

    if (state.inspectedPlayer && state.inspectedPlayer.id === playerId) {
      state.inspectedPlayer.is_following = data.is_following;
      state.inspectedPlayer.followers_count = data.followers_count;
      updateInspectModalFollowButton(data.is_following, data.followers_count);
    }

    showNotificationToast(
      data.is_following ? "Nuovo Seguito! ⭐" : "Non segui più",
      data.message,
      data.is_following ? "success" : "info"
    );

    lucide.createIcons();
  } catch (err) {
    console.error('Follow toggle error:', err);
    showNotificationToast("Errore", "Si è verificato un errore durante l'aggiornamento.", "error");
  }
}

let isInspectCardFlipped = false;

function initInspectCardTilt() {
  const container = document.getElementById('inspectCardPerspective');
  const card = document.getElementById('inspectCardWrapper');
  const shine = document.getElementById('inspectCardShine');
  if (!container || !card) return;

  let touchHoldTimer = null;
  let is3DModeActive = false;
  let startTouchX = 0;
  let startTouchY = 0;
  let hasMoved = false;

  function applyTilt(x, y, rect, scale = 1.04) {
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mult = isInspectCardFlipped ? -1 : 1;
    const rotateX = Math.min(Math.max(((y - centerY) / centerY) * -18, -25), 25);
    const rotateY = Math.min(Math.max(((x - centerX) / centerX) * (18 * mult), -25), 25);

    card.classList.remove('smooth-reset');
    card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (shine) {
      if (isInspectCardFlipped) {
        shine.style.opacity = '0';
      } else {
        const shineX = Math.min(Math.max((x / rect.width) * 100, 0), 100);
        const shineY = Math.min(Math.max((y / rect.height) * 100, 0), 100);
        shine.style.setProperty('--shine-x', `${shineX.toFixed(1)}%`);
        shine.style.setProperty('--shine-y', `${shineY.toFixed(1)}%`);
        shine.style.opacity = '1';
      }
    }
  }

  function resetTilt() {
    card.classList.add('smooth-reset');
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    if (shine) shine.style.opacity = '0.35';
  }

  // 1. Mouse Events (Desktop)
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    applyTilt(x, y, rect, 1.03);
  });

  container.addEventListener('mouseleave', () => {
    resetTilt();
  });

  // 2. Touch Events (Mobile: scorrimento modal fluido di default, rotazione 3D solo con pressione prolungata)
  container.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    startTouchX = touch.clientX;
    startTouchY = touch.clientY;
    hasMoved = false;
    is3DModeActive = false;

    clearTimeout(touchHoldTimer);
    touchHoldTimer = setTimeout(() => {
      if (!hasMoved) {
        is3DModeActive = true;
        card.classList.add('touch-3d-active');
        if (navigator.vibrate) {
          try { navigator.vibrate(25); } catch (_) {}
        }
        const rect = container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        applyTilt(x, y, rect, 1.05);
      }
    }, 220);
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - startTouchX);
    const diffY = Math.abs(touch.clientY - startTouchY);

    if (!is3DModeActive) {
      if (diffX > 8 || diffY > 8) {
        hasMoved = true;
        clearTimeout(touchHoldTimer); // Annulla rotazione e lascia scrollare il popup verso il basso!
      }
      return;
    }

    // Modalità 3D attiva intenzionalmente: ruota la carta
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    applyTilt(x, y, rect, 1.05);
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  function endTouch() {
    clearTimeout(touchHoldTimer);
    is3DModeActive = false;
    hasMoved = false;
    card.classList.remove('touch-3d-active');
    resetTilt();
  }

  container.addEventListener('touchend', endTouch, { passive: true });
  container.addEventListener('touchcancel', endTouch, { passive: true });
}

function flipInspectPlayerCard() {
  SoundFX.playClick();
  const flipper = document.getElementById('inspectCardFlipper');
  const wrapper = document.getElementById('inspectCardWrapper');
  const flipBtnLabel = document.getElementById('inspectFlipBtnLabel');
  if (!flipper) return;

  isInspectCardFlipped = !isInspectCardFlipped;

  if (wrapper) {
    wrapper.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  if (isInspectCardFlipped) {
    flipper.classList.add('is-flipped');
    if (flipBtnLabel) flipBtnLabel.innerText = "Vedi Fronte";
  } else {
    flipper.classList.remove('is-flipped');
    if (flipBtnLabel) flipBtnLabel.innerText = "Gira Retro";
  }
}

async function openInspectPlayerCard(playerId) {
  SoundFX.playClick();
  const modal = document.getElementById('viewPlayerModal');
  if (!modal) return;

  // Reset flip state to front initially
  isInspectCardFlipped = false;
  const flipper = document.getElementById('inspectCardFlipper');
  if (flipper) flipper.classList.remove('is-flipped');
  const flipBtnLabel = document.getElementById('inspectFlipBtnLabel');
  if (flipBtnLabel) flipBtnLabel.innerText = "Gira Retro";
  const inspectWrapper = document.getElementById('inspectCardWrapper');
  if (inspectWrapper) inspectWrapper.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

  try {
    const viewerId = state.currentUser ? (state.currentUser.player_id || 'user_' + state.currentUser.id || state.currentUser.username) : '';
    const res = await fetch(`/api/players/${playerId}/card?viewer_id=${encodeURIComponent(viewerId)}`);
    if (!res.ok) {
      showNotificationToast("Attenzione", "Scheda giocatore non trovata.", "error");
      return;
    }
    const p = await res.json();
    state.inspectedPlayer = p;

    // --- FRONT OF CARD ---
    document.getElementById('inspectOvrDisplay').innerText = p.ovr || 75;
    
    let roleCode = "CC";
    if (p.primary_role === "Portiere") roleCode = "POR";
    else if (p.primary_role === "Difensore") roleCode = "DIF";
    else if (p.primary_role === "Attaccante") roleCode = "ATT";
    else if (p.primary_role === "Jolly") roleCode = "JOL";
    document.getElementById('inspectRoleDisplay').innerText = roleCode;

    document.getElementById('inspectFollowersCount').innerText = p.followers_count || 0;
    document.getElementById('inspectPhotoDisplay').src = p.photo_url || '/static/avatars/bomber.svg';
    document.getElementById('inspectFootDisplay').innerText = p.foot === 'Destro' ? 'Dx' : (p.foot === 'Sinistro' ? 'Sx' : 'Amb');
    document.getElementById('inspectAgeDisplay').innerText = `${p.age || 25} anni`;
    document.getElementById('inspectNameDisplay').innerText = (p.name || 'GIOCATORE').toUpperCase();
    document.getElementById('inspectNicknameDisplay').innerText = p.linked_username ? `@${p.linked_username}` : (p.nickname || '');

    document.getElementById('inspectVelDisplay').innerText = p.stats_vel || 75;
    document.getElementById('inspectDriDisplay').innerText = p.stats_dri || 75;
    document.getElementById('inspectTirDisplay').innerText = p.stats_tir || 75;
    document.getElementById('inspectDifDisplay').innerText = p.stats_dif || 75;
    document.getElementById('inspectPasDisplay').innerText = p.stats_pas || 75;
    document.getElementById('inspectFisDisplay').innerText = p.stats_fis || 75;

    document.getElementById('inspectCityDisplay').innerHTML = `📍 ${p.city || 'Italia'}`;
    document.getElementById('inspectReliabilityDisplay').innerHTML = `🛡️ ${p.reliability_score || 100}%`;

    const themeClass = `theme-${p.card_theme || 'gold'}`;
    const cardFront = document.getElementById('inspectCardFront');
    if (cardFront) {
      cardFront.className = `fut-card-front holographic-card ${themeClass} p-6 flex flex-col justify-between select-none relative shadow-2xl rounded-3xl`;
    }

    // Front Badges Preview
    const badgesPreview = document.getElementById('inspectBadgesPreview');
    const badges = Array.isArray(p.badges) ? p.badges : [];
    if (badgesPreview) {
      if (badges.length > 0) {
        badgesPreview.innerHTML = badges.slice(0, 3).map(b => `
          <span class="bg-black/90 text-amber-300 border border-amber-400/50 text-[10px] px-2 py-0.5 rounded-full font-black">
            ${b.split(' ')[0]} ${b.split(' ')[1] || ''}
          </span>
        `).join('');
      } else {
        badgesPreview.innerHTML = ``;
      }
    }

    // --- BACK OF CARD ---
    const cardBack = document.getElementById('inspectCardBack');
    if (cardBack) {
      cardBack.className = `fut-card-back ${themeClass} p-6 flex flex-col justify-between select-none shadow-2xl border-2 border-amber-400 rounded-3xl`;
    }

    const backName = document.getElementById('inspectCardBackNameDisplay');
    if (backName) backName.innerText = (p.name || 'GIOCATORE').toUpperCase();

    const fpBadge = document.getElementById('inspectFairPlayRatingBadge');
    if (fpBadge) fpBadge.innerText = `⭐ ${(Number(p.fair_play_rating) || 5.0).toFixed(1)} PERSONA`;

    const saBadge = document.getElementById('inspectSkillAccuracyBadge');
    if (saBadge) saBadge.innerText = `🎯 ${(Number(p.card_accuracy_rating) || 5.0).toFixed(1)} SCHEDA`;

    const matchesElem = document.getElementById('inspectMatchesPlayedDisplay');
    if (matchesElem) matchesElem.innerText = p.matches_played || 0;

    const mvpElem = document.getElementById('inspectMvpDisplay');
    if (mvpElem) mvpElem.innerText = p.mvp_count || 0;

    const relPctElem = document.getElementById('inspectReliabilityPctDisplay');
    if (relPctElem) relPctElem.innerText = `${p.reliability_score || 100}%`;

    const bioElem = document.getElementById('inspectCardBackBioDisplay');
    if (bioElem) {
      bioElem.innerText = p.bio ? `"${p.bio}"` : `"Pronto a scendere in campo e dare il massimo per la squadra!"`;
    }

    const backBadgesList = document.getElementById('inspectCardBackBadgesList');
    if (backBadgesList) {
      if (badges.length > 0) {
        backBadgesList.innerHTML = badges.map(b => `
          <div class="flex items-center gap-1.5 text-amber-200">
            <i data-lucide="award" class="w-3.5 h-3.5 text-amber-400 flex-shrink-0"></i>
            <span>${b}</span>
          </div>
        `).join('');
      } else {
        backBadgesList.innerHTML = `<p class="text-xs text-slate-400 italic">Ancora nessuna targhetta sbloccata</p>`;
      }
    }

    // WhatsApp Contact CTA
    const waLink = document.getElementById('inspectWhatsAppLink');
    if (waLink) {
      const rawPhone = p.phone || '';
      const waClean = rawPhone.replace(/[^0-9]/g, '');
      if (waClean.length >= 8) {
        waLink.href = `https://wa.me/${waClean}?text=Ciao%20${encodeURIComponent(p.name)}!%20Ti%20ho%20trovato%20su%20Trova%20l'Ultimo,%20giochi%20con%20noi?`;
        waLink.target = "_blank";
        waLink.onclick = null;
        waLink.innerHTML = `<i data-lucide="phone-call" class="w-3.5 h-3.5"></i><span>Contatta su WhatsApp</span>`;
      } else {
        waLink.href = 'javascript:void(0)';
        waLink.target = "";
        waLink.onclick = () => {
          closeInspectPlayerCard();
          closePlayerSearchModal();
          openChatCenterModal(p.id, p.name);
        };
        waLink.innerHTML = `<i data-lucide="message-circle" class="w-3.5 h-3.5"></i><span>Invia Messaggio in Chat</span>`;
      }
    }

    updateInspectModalFollowButton(p.is_following, p.followers_count || 0);

    modal.classList.remove('hidden');
    lucide.createIcons();
  } catch (err) {
    console.error('Inspect error:', err);
    showNotificationToast("Errore", "Impossibile aprire la scheda del giocatore.", "error");
  }
}

function updateInspectModalFollowButton(isFollowing, count) {
  const btn = document.getElementById('inspectFollowBtn');
  const btnText = document.getElementById('inspectFollowBtnText');
  const countElem = document.getElementById('inspectFollowersCount');
  if (countElem) countElem.innerText = count;

  const isMe = state.currentUser && state.inspectedPlayer && (
    state.inspectedPlayer.id === state.currentUser.player_id ||
    state.inspectedPlayer.id === 'user_' + state.currentUser.id ||
    state.inspectedPlayer.linked_username === state.currentUser.username
  );

  if (btn && btnText) {
    if (isMe) {
      btn.className = "flex-1 py-3 rounded-2xl bg-slate-800 text-slate-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-default";
      btnText.innerText = "La Tua Scheda";
      btn.disabled = true;
    } else if (isFollowing) {
      btn.className = "flex-1 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg";
      btnText.innerText = "✓ Stai seguendo";
      btn.disabled = false;
    } else {
      btn.className = "flex-1 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-cyan-500/25";
      btnText.innerText = "Segui Giocatore";
      btn.disabled = false;
    }
  }
}

function closeInspectPlayerCard() {
  SoundFX.playClick();
  const modal = document.getElementById('viewPlayerModal');
  if (modal) modal.classList.add('hidden');
  isInspectCardFlipped = false;
  const flipper = document.getElementById('inspectCardFlipper');
  if (flipper) flipper.classList.remove('is-flipped');
  const inspectWrapper = document.getElementById('inspectCardWrapper');
  if (inspectWrapper) inspectWrapper.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
}

function toggleFollowInspectedPlayer() {
  if (!state.inspectedPlayer) return;
  toggleFollowPlayer(state.inspectedPlayer.id);
}

function startChatWithInspectedPlayer() {
  if (!state.inspectedPlayer) return;
  const p = state.inspectedPlayer;
  closeInspectPlayerCard();
  closePlayerSearchModal();
  openChatCenterModal(p.id, p.name);
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('createMatchDate');
  if (dateInput) dateInput.value = today;

  initRealGPS();
  updateAuthUI();
  fetchMatches();
  fetchUserProfile();
  initCardTilt();
  initInspectCardTilt();
  checkPendingReviews();
  fetchUserNotifications();
  setInterval(fetchUserNotifications, 8000);
  checkChatBadge();
  lucide.createIcons();

  // Register PWA Service Worker for Mobile Web App
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js').then((reg) => {
      console.log('Trova l\'Ultimo PWA Service Worker pronto.');
    }).catch(err => {
      console.log('SW registration note:', err);
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_OPENED') {
        const notifData = event.data.data;
        if (notifData) handleNotificationClick(notifData);
      }
    });
  }
});

