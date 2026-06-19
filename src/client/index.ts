import {
  ApiEndpoint,
  type Kitten,
  type GameLog,
  type PlayerProfile,
  type InitResponse,
  type ActionRequest,
  type ActionResponse,
  type RenameRequest,
  type RenameResponse,
  type TimeWarpRequest,
  type TimeWarpResponse,
  type CareActionType,
} from "../shared/api.ts";

// State
let kittensList: Kitten[] = [];
let catsList: Kitten[] = [];
let selectedKitten: Kitten | null = null;
let currentUsername = "";
let isModerator = false;

// DOM Elements
const hudSubreddit = document.getElementById("hud-subreddit") as HTMLSpanElement;
const hudUsername = document.getElementById("hud-username") as HTMLSpanElement;
const hudActions = document.getElementById("hud-actions") as HTMLSpanElement;

const kittenCardsContainer = document.getElementById("kitten-list") as HTMLDivElement;
const sanctuaryGallery = document.getElementById("sanctuary-gallery") as HTMLDivElement;
const activityLog = document.getElementById("activity-log") as HTMLDivElement;
const leaderboardList = document.getElementById("leaderboard-list") as HTMLDivElement;

const petName = document.getElementById("pet-name") as HTMLHeadingElement;
const petStageBadge = document.getElementById("pet-stage-badge") as HTMLSpanElement;
const petOwner = document.getElementById("pet-owner") as HTMLSpanElement;
const kittenVisual = document.getElementById("kitten-visual") as HTMLDivElement;
const petSpeech = document.getElementById("pet-speech") as HTMLDivElement;
const petSpeechText = document.getElementById("pet-speech-text") as HTMLSpanElement;
const btnSummonStray = document.getElementById("btn-summon-stray") as HTMLButtonElement;
const particleEmitter = document.getElementById("particle-emitter") as HTMLDivElement;
const statusBalloon = document.getElementById("status-balloon") as HTMLDivElement;

const barHunger = document.getElementById("bar-hunger") as HTMLDivElement;
const barHappiness = document.getElementById("bar-happiness") as HTMLDivElement;
const barCleanliness = document.getElementById("bar-cleanliness") as HTMLDivElement;

const valHunger = document.getElementById("val-hunger") as HTMLSpanElement;
const valHappiness = document.getElementById("val-happiness") as HTMLSpanElement;
const valCleanliness = document.getElementById("val-cleanliness") as HTMLSpanElement;

const btnFeed = document.getElementById("btn-feed") as HTMLButtonElement;
const btnPlay = document.getElementById("btn-play") as HTMLButtonElement;
const btnClean = document.getElementById("btn-clean") as HTMLButtonElement;
const btnPet = document.getElementById("btn-pet") as HTMLButtonElement;

// Rename Modal Elements
const renameModal = document.getElementById("rename-modal") as HTMLDivElement;
const renameInput = document.getElementById("rename-input") as HTMLInputElement;
const btnRenameTrigger = document.getElementById("btn-rename-trigger") as HTMLButtonElement;
const btnRenameCancel = document.getElementById("btn-rename-cancel") as HTMLButtonElement;
const btnRenameSave = document.getElementById("btn-rename-save") as HTMLButtonElement;

// Admin Elements
const adminControls = document.getElementById("admin-controls") as HTMLElement;
const btnWarp1 = document.getElementById("btn-warp-1") as HTMLButtonElement;
const btnWarp12 = document.getElementById("btn-warp-12") as HTMLButtonElement;
const btnWarp72 = document.getElementById("btn-warp-72") as HTMLButtonElement;

// Generate SVG Code for Kitten/Cat
function getKittenSvg(color: string, eyesType: string, isCat: boolean, headOnly: boolean = false): string {
  let eyesSvg = "";
  switch (eyesType) {
    case "happy":
      eyesSvg = `
        <path d="M 25 48 Q 34 37 43 48" stroke="#000" stroke-width="5.5" stroke-linecap="round" fill="none"/>
        <path d="M 57 48 Q 66 37 75 48" stroke="#000" stroke-width="5.5" stroke-linecap="round" fill="none"/>
      `;
      break;
    case "sad":
      eyesSvg = `
        <circle cx="34" cy="46" r="9" fill="#fff" stroke="#000" stroke-width="5"/>
        <circle cx="66" cy="46" r="9" fill="#fff" stroke="#000" stroke-width="5"/>
        <path d="M 23 37 L 33 42" stroke="#000" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 77 37 L 67 42" stroke="#000" stroke-width="4.5" stroke-linecap="round"/>
      `;
      break;
    case "sleeping":
      eyesSvg = `
        <path d="M 24 46 H 44" stroke="#000" stroke-width="6" stroke-linecap="round"/>
        <path d="M 56 46 H 76" stroke="#000" stroke-width="6" stroke-linecap="round"/>
      `;
      break;
    case "normal":
    default:
      eyesSvg = `
        <circle cx="34" cy="46" r="9.5" fill="#fff" stroke="#000" stroke-width="5"/>
        <circle cx="66" cy="46" r="9.5" fill="#fff" stroke="#000" stroke-width="5"/>
      `;
      break;
  }

  const scale = isCat ? "scale(1.18)" : "scale(1)";
  const translate = isCat ? "translate(-8, -13)" : "translate(0, 0)";
  
  if (headOnly) {
    return `
      <svg viewBox="10 10 80 80" class="svg-kitten">
        <!-- Head Silhouette -->
        <path d="M 36 24 L 12 15 Q 15 28, 22 38 L 15 41 L 23 45 L 16 49 L 24 53 Q 50 70, 76 53 L 84 49 L 77 45 L 85 41 L 78 38 Q 85 28, 88 15 L 64 24 L 59 23 L 57 16 L 51 22 L 48 17 L 43 23 L 40 18 Z" fill="${color}" stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
        
        <!-- Inner Ears -->
        <path d="M 32 23 L 16 18 Q 18 26, 22 32 Z" fill="#FF8A5B"/>
        <path d="M 68 23 L 84 18 Q 82 26, 78 32 Z" fill="#FF8A5B"/>
        
        <!-- Forehead Tufts -->
        <path d="M 43 31 Q 46.5 27 50 31 Q 53.5 27 57 31" stroke="rgba(0,0,0,0.25)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        
        <!-- Whiskers -->
        <line x1="26" y1="50" x2="31" y2="51" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="25" y1="53" x2="30" y2="54" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="26" y1="56" x2="31" y2="56" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="74" y1="50" x2="69" y2="51" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="75" y1="53" x2="70" y2="54" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="74" y1="56" x2="69" y2="56" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        
        <!-- Tongue Blep -->
        <path d="M 47 56 C 47 65, 53 65, 53 56 Z" fill="#ff4d79" stroke="#000" stroke-width="4.5"/>
        <line x1="50" y1="56" x2="50" y2="61" stroke="#000" stroke-width="3" stroke-linecap="round"/>
        
        <!-- Mouth -->
        <path d="M 42 55 Q 46 60 50 55 Q 54 60 58 55" stroke="#000" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        
        <!-- Nose -->
        <ellipse cx="50" cy="53" rx="5" ry="3.5" fill="#ff7da0" stroke="#000" stroke-width="4"/>
        
        <!-- Eyes -->
        <g class="kitten-eyes">
          ${eyesSvg}
        </g>
        
        <!-- Collar -->
        ${isCat ? `
          <path d="M 33 60 Q 50 65 67 60" stroke="#f43f5e" stroke-width="5.5" stroke-linecap="round" fill="none"/>
          <circle cx="50" cy="64" r="5" fill="#fbbf24" stroke="#000" stroke-width="2"/>
        ` : ""}
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 100 100" class="svg-kitten" style="transform: ${translate} ${scale};">
      <!-- Tail -->
      <g class="kitten-tail">
        <path d="M 68 82 C 78 82, 85 75, 82 60 C 80 50, 88 45, 85 35" fill="none" stroke="#000" stroke-width="8" stroke-linecap="round"/>
        <path d="M 68 82 C 78 82, 85 75, 82 60 C 80 50, 88 45, 85 35" fill="none" stroke="${color}" stroke-width="4.5" stroke-linecap="round"/>
      </g>
      
      <!-- Body -->
      <path d="M 33 60 C 25 70, 20 85, 30 88 C 40 90, 60 90, 70 88 C 80 85, 75 70, 67 60 Z" fill="${color}" stroke="#000" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="50" cy="74" rx="15" ry="9" fill="rgba(255,255,255,0.2)"/>
      
      <!-- Paws -->
      <ellipse cx="40" cy="88" rx="8" ry="5" fill="${color}" stroke="#000" stroke-width="4.5"/>
      <ellipse cx="60" cy="88" rx="8" ry="5" fill="${color}" stroke="#000" stroke-width="4.5"/>
      
      <!-- Head Assembly (wrapped in group for head tilt/lick animations) -->
      <g class="kitten-head-group">
        <!-- Head Silhouette (combines base, ears, cheek spikes, and top tufts to avoid inner outlines) -->
        <path d="M 36 24 L 12 15 Q 15 28, 22 38 L 15 41 L 23 45 L 16 49 L 24 53 Q 50 70, 76 53 L 84 49 L 77 45 L 85 41 L 78 38 Q 85 28, 88 15 L 64 24 L 59 23 L 57 16 L 51 22 L 48 17 L 43 23 L 40 18 Z" fill="${color}" stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
        
        <!-- Inner Ears -->
        <path d="M 32 23 L 16 18 Q 18 26, 22 32 Z" fill="#FF8A5B"/>
        <path d="M 68 23 L 84 18 Q 82 26, 78 32 Z" fill="#FF8A5B"/>
        
        <!-- Forehead Tufts (double-arch forehead marking) -->
        <path d="M 43 31 Q 46.5 27 50 31 Q 53.5 27 57 31" stroke="rgba(0,0,0,0.25)" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        
        <!-- Cheek whisker markings -->
        <!-- Left Cheek -->
        <line x1="26" y1="50" x2="31" y2="51" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="25" y1="53" x2="30" y2="54" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="26" y1="56" x2="31" y2="56" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Right Cheek -->
        <line x1="74" y1="50" x2="69" y2="51" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="75" y1="53" x2="70" y2="54" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="74" y1="56" x2="69" y2="56" stroke="rgba(0,0,0,0.2)" stroke-width="2.5" stroke-linecap="round"/>
        
        <!-- Tongue Blep (draw behind mouth lines for neat outline intersection) -->
        <path d="M 47 56 C 47 65, 53 65, 53 56 Z" fill="#ff4d79" stroke="#000" stroke-width="4.5"/>
        <line x1="50" y1="56" x2="50" y2="61" stroke="#000" stroke-width="3" stroke-linecap="round"/>
        
        <!-- Mouth curves -->
        <path d="M 42 55 Q 46 60 50 55 Q 54 60 58 55" stroke="#000" stroke-width="4.5" stroke-linecap="round" fill="none"/>
        
        <!-- Nose -->
        <ellipse cx="50" cy="53" rx="5" ry="3.5" fill="#ff7da0" stroke="#000" stroke-width="4"/>
        
        <!-- Eyes -->
        <g class="kitten-eyes">
          ${eyesSvg}
        </g>
        
        <!-- Collar for Mature Cats -->
        ${isCat ? `
          <path d="M 33 60 Q 50 65 67 60" stroke="#f43f5e" stroke-width="5.5" stroke-linecap="round" fill="none"/>
          <circle cx="50" cy="64" r="5" fill="#fbbf24" stroke="#000" stroke-width="2"/>
        ` : ""}
      </g>
    </svg>
  `;
}

// Particle Helper
function triggerParticles(emoji: string) {
  for (let i = 0; i < 6; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = emoji;
    p.style.left = `${40 + Math.random() * 20}%`;
    p.style.top = `${40 + Math.random() * 20}%`;
    p.style.animationDelay = `${Math.random() * 0.2}s`;
    particleEmitter.appendChild(p);
    
    setTimeout(() => {
      p.remove();
    }, 1200);
  }
}

// Update Active Viewport Display
function updateActivePetDisplay() {
  // Sync selected and shiver classes for playpen elements
  const playpenKittens = document.querySelectorAll(".playpen-kitten");
  playpenKittens.forEach((el) => {
    const kid = el.getAttribute("data-id");
    const isSel = selectedKitten && kid === selectedKitten.id;
    el.classList.toggle("selected", !!isSel);
    
    const kData = kittensList.find(x => x.id === kid);
    const svgWrap = el.querySelector(".kitten-svg-wrapper");
    if (svgWrap && kData) {
      svgWrap.classList.toggle("anim-neglected", kData.neglectedSince !== null);
    }
  });

  if (!selectedKitten) {
    petName.textContent = "Adopt a Kitten!";
    petStageBadge.classList.add("hidden");
    petOwner.textContent = "u/-";
    statusBalloon.classList.add("hidden");
    
    // Reset stats
    barHunger.style.width = "0%";
    valHunger.textContent = "0%";
    barHappiness.style.width = "0%";
    valHappiness.textContent = "0%";
    barCleanliness.style.width = "0%";
    valCleanliness.textContent = "0%";

    // Disable controls
    btnFeed.disabled = true;
    btnPlay.disabled = true;
    btnClean.disabled = true;
    btnPet.disabled = true;
    btnRenameTrigger.classList.add("hidden");
    return;
  }

  // Set Details
  petName.textContent = selectedKitten.name;
  petStageBadge.textContent = selectedKitten.stage;
  petStageBadge.className = `badge ${selectedKitten.stage === "cat" ? "cat-stage" : ""}`;
  petStageBadge.classList.remove("hidden");
  petOwner.textContent = `u/${selectedKitten.ownerUser}`;

  // Enable/Disable Rename
  const isOwner = selectedKitten.ownerUser === currentUsername;
  if (isOwner || isModerator) {
    btnRenameTrigger.classList.remove("hidden");
  } else {
    btnRenameTrigger.classList.add("hidden");
  }

  const isCat = selectedKitten.stage === "cat";

  // Stats
  const h = Math.round(selectedKitten.hunger);
  const ha = Math.round(selectedKitten.happiness);
  const c = Math.round(selectedKitten.cleanliness);

  barHunger.style.width = `${h}%`;
  valHunger.textContent = `${h}%`;
  barHappiness.style.width = `${ha}%`;
  valHappiness.textContent = `${ha}%`;
  barCleanliness.style.width = `${c}%`;
  valCleanliness.textContent = `${c}%`;

  // Status Balloon
  if (selectedKitten.neglectedSince !== null) {
    statusBalloon.querySelector(".balloon-text")!.textContent = "Neglected! 😿 Help!";
    statusBalloon.classList.remove("hidden");
  } else if (h < 30) {
    statusBalloon.querySelector(".balloon-text")!.textContent = "Feed me! 🐟";
    statusBalloon.classList.remove("hidden");
  } else if (ha < 30) {
    statusBalloon.querySelector(".balloon-text")!.textContent = "Play with me! 🧶";
    statusBalloon.classList.remove("hidden");
  } else if (c < 30) {
    statusBalloon.querySelector(".balloon-text")!.textContent = "Need a bath! 🧼";
    statusBalloon.classList.remove("hidden");
  } else {
    statusBalloon.classList.add("hidden");
  }

  // Care actions enablement (Cats don't need care decay or actions)
  const isCareDisabled = isCat;
  btnFeed.disabled = isCareDisabled;
  btnPlay.disabled = isCareDisabled;
  btnClean.disabled = isCareDisabled;
  btnPet.disabled = isCareDisabled;
}

// Render Lists
function renderLitterList() {
  kittenCardsContainer.innerHTML = "";
  if (kittensList.length === 0) {
    kittenCardsContainer.innerHTML = `
      <div class="empty-gallery-msg">
        Litter is empty. Wait for a caretaker to join and adopt, or check for runaways!
      </div>
    `;
    return;
  }

  kittensList.forEach((k) => {
    const card = document.createElement("div");
    card.className = `kitten-card ${selectedKitten && selectedKitten.id === k.id ? "active" : ""}`;
    
    // Calculate overall stats status
    const avgStat = (k.hunger + k.happiness + k.cleanliness) / 3;
    let statusText = "Healthy";
    if (k.neglectedSince !== null) {
      statusText = "Neglected";
    } else if (avgStat < 40) {
      statusText = "Needs attention";
    }

    card.innerHTML = `
      <div class="kitten-avatar-mini" style="background: rgba(0,0,0,0.15)">
        ${getKittenSvg(k.color, "normal", false, true)}
      </div>
      <div class="kitten-card-info">
        <div class="kitten-card-name" style="color: ${k.color}">${k.name}</div>
        <div class="kitten-card-status">${statusText}</div>
        <div class="kitten-mini-bars">
          <div class="mini-bar">
            <div class="mini-bar-fill fill-hunger" style="width: ${k.hunger}%"></div>
          </div>
          <div class="mini-bar">
            <div class="mini-bar-fill fill-happiness" style="width: ${k.happiness}%"></div>
          </div>
          <div class="mini-bar">
            <div class="mini-bar-fill fill-cleanliness" style="width: ${k.cleanliness}%"></div>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      selectedKitten = k;
      renderLitterList();
      updateActivePetDisplay();
    });

    kittenCardsContainer.appendChild(card);
  });
}

function renderSanctuaryGallery() {
  sanctuaryGallery.innerHTML = "";
  if (catsList.length === 0) {
    sanctuaryGallery.innerHTML = `<p class="empty-gallery-msg">No cats successfully raised yet. Take good care of your kittens!</p>`;
    return;
  }

  catsList.forEach((c) => {
    const item = document.createElement("div");
    item.className = `cat-gallery-item ${selectedKitten && selectedKitten.id === c.id ? "active" : ""}`;
    item.innerHTML = `
      <div class="cat-avatar-mini">
        ${getKittenSvg(c.color, "happy", true, true)}
      </div>
      <div class="cat-gallery-name" style="color: ${c.color}">${c.name}</div>
    `;
    
    item.addEventListener("click", () => {
      selectedKitten = c;
      renderLitterList();
      renderSanctuaryGallery();
      updateActivePetDisplay();
    });

    sanctuaryGallery.appendChild(item);
  });
}

function renderLogs(logs: GameLog[]) {
  activityLog.innerHTML = "";
  if (logs.length === 0) {
    activityLog.innerHTML = `<p class="empty-gallery-msg">No activity yet. Be the first to pet a kitten!</p>`;
    return;
  }

  logs.forEach((l) => {
    const item = document.createElement("div");
    item.className = "log-item";
    
    const timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `
      <span class="log-time">[${timeStr}]</span>
      <span class="log-text">${l.text}</span>
    `;
    activityLog.appendChild(item);
  });
}

interface LeaderboardItem {
  username: string;
  score: number;
}

function renderLeaderboard(list: LeaderboardItem[]) {
  leaderboardList.innerHTML = "";
  if (!list || list.length === 0) {
    leaderboardList.innerHTML = `<p class="empty-gallery-msg">No actions logged yet. Start caring for kittens!</p>`;
    return;
  }

  // Display top 5 to fit inside compact sidebar
  const topList = list.slice(0, 5);
  topList.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-item";
    row.innerHTML = `
      <span class="leaderboard-rank">#${index + 1}</span>
      <span class="leaderboard-user">u/${item.username}</span>
      <span class="leaderboard-score">${item.score} pts</span>
    `;
    leaderboardList.appendChild(row);
  });
}

// Fetch Init Game State
async function fetchInit() {
  try {
    const res = await fetch(ApiEndpoint.Init);
    if (!res.ok) throw new Error("Init fetch failed");
    const data: InitResponse = await res.json();
    
    currentUsername = data.username;
    isModerator = data.isModerator;
    kittensList = data.kittens;
    catsList = data.cats;

    // HUD
    hudSubreddit.textContent = `r/${data.subredditName}`;
    hudUsername.textContent = `u/${data.username}`;
    hudActions.textContent = data.profile.actionsPerformed.toString();

    // Show/hide Admin warper controls
    if (isModerator) {
      adminControls.classList.remove("hidden");
    } else {
      adminControls.classList.add("hidden");
    }

    // Default select first kitten if none selected
    if (kittensList.length > 0) {
      // Find matching selected kitten in new list or select first
      const matched = kittensList.find(x => selectedKitten && x.id === selectedKitten.id);
      selectedKitten = matched || kittensList[0] || null;
    } else if (catsList.length > 0) {
      const matched = catsList.find(x => selectedKitten && x.id === selectedKitten.id);
      selectedKitten = matched || catsList[0] || null;
    } else {
      selectedKitten = null;
    }

    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    renderLeaderboard(data.leaderboard);
    renderPlaypen();
    updateActivePetDisplay();
  } catch (err) {
    console.error("Error during initial state sync:", err);
  }
}

// Perform Care Action
async function performCareAction(actionType: CareActionType) {
  if (!selectedKitten) return;
  
  // Visual Trigger on selected playpen element
  const selectedWrap = document.querySelector(`.playpen-kitten[data-id="${selectedKitten.id}"] .kitten-svg-wrapper`);
  if (selectedWrap) {
    selectedWrap.classList.add(`anim-${actionType}`);
  }
  
  let emoji = "❤️";
  if (actionType === "feed") emoji = "🐟";
  if (actionType === "play") emoji = "🧶";
  if (actionType === "clean") emoji = "🧼";
  
  triggerParticles(emoji);

  try {
    const reqBody: ActionRequest = {
      kittenId: selectedKitten.id,
      action: actionType,
    };
    
    const res = await fetch(ApiEndpoint.Action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) throw new Error("Action failed");
    
    const data: ActionResponse = await res.json();
    kittensList = data.kittens;
    catsList = data.cats;
    
    // Update active kitten reference
    const matched = kittensList.find(x => x.id === selectedKitten!.id) || catsList.find(x => x.id === selectedKitten!.id);
    if (matched) {
      selectedKitten = matched;
    }

    // Refresh display
    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    renderLeaderboard(data.leaderboard);
    renderPlaypen();
    updateActivePetDisplay();
    
    hudActions.textContent = data.profile.actionsPerformed.toString();
  } catch (err) {
    console.error("Action error:", err);
  } finally {
    // Clear animation classes
    setTimeout(() => {
      if (selectedKitten) {
        const wrap = document.querySelector(`.playpen-kitten[data-id="${selectedKitten.id}"] .kitten-svg-wrapper`);
        if (wrap) {
          wrap.classList.remove(`anim-${actionType}`);
        }
      }
    }, 800);
  }
}

// Rename Handler
async function performRename() {
  if (!selectedKitten) return;
  const newName = renameInput.value.trim();
  if (newName.length === 0) return;

  try {
    const reqBody: RenameRequest = {
      kittenId: selectedKitten.id,
      newName,
    };
    
    const res = await fetch(ApiEndpoint.Rename, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) throw new Error("Rename failed");
    
    const data: RenameResponse = await res.json();
    if (data.success) {
      kittensList = data.kittens;
      const matched = kittensList.find(x => x.id === selectedKitten!.id);
      if (matched) {
        selectedKitten = matched;
      }
      renameModal.classList.add("hidden");
      renderLitterList();
      updateActivePetDisplay();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
}

// Admin Time Warp Handler
async function performTimeWarp(hours: number) {
  try {
    const reqBody: TimeWarpRequest = { hours };
    const res = await fetch(ApiEndpoint.TimeWarp, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });
    
    if (!res.ok) throw new Error("Time warp failed");
    
    const data: TimeWarpResponse = await res.json();
    kittensList = data.kittens;
    catsList = data.cats;
    
    const matched = kittensList.find(x => selectedKitten && x.id === selectedKitten.id) || catsList.find(x => selectedKitten && x.id === selectedKitten.id);
    selectedKitten = matched || kittensList[0] || catsList[0] || null;

    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    updateActivePetDisplay();
  } catch (err) {
    console.error(err);
  }
}

// Event Listeners
btnFeed.addEventListener("click", () => performCareAction("feed"));
btnPlay.addEventListener("click", () => performCareAction("play"));
btnClean.addEventListener("click", () => performCareAction("clean"));
btnPet.addEventListener("click", () => performCareAction("pet"));

// Rename Modal Toggles
btnRenameTrigger.addEventListener("click", () => {
  if (!selectedKitten) return;
  renameInput.value = selectedKitten.name;
  renameModal.classList.remove("hidden");
  renameInput.focus();
});

btnRenameCancel.addEventListener("click", () => {
  renameModal.classList.add("hidden");
});

btnRenameSave.addEventListener("click", performRename);
renameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") performRename();
});

// Admin Warping
btnWarp1.addEventListener("click", () => performTimeWarp(1));
btnWarp12.addEventListener("click", () => performTimeWarp(12));
btnWarp72.addEventListener("click", () => performTimeWarp(72));

// Summon Stray Handler
btnSummonStray.addEventListener("click", async () => {
  try {
    const res = await fetch(ApiEndpoint.SpawnStray, { method: "POST" });
    if (!res.ok) throw new Error("Spawn stray failed");
    const data = await res.json();
    kittensList = data.kittens;
    catsList = data.cats;
    
    // Select the new stray kitten
    if (kittensList.length > 0) {
      selectedKitten = kittensList[kittensList.length - 1] || null;
    }
    
    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    renderPlaypen();
    updateActivePetDisplay();
    triggerParticles("🐱");
  } catch (err) {
    console.error(err);
  }
});

// Autonomous behaviors data and logic
const AUTONOMOUS_SPEECHES = [
  "Meow! 🐾",
  "Purrr... 😻",
  "Zzz... 💤",
  "Chasing a laser dot! 🔴",
  "Catching dust bunnies!",
  "Knocked over the milk... 🥛",
  "Where's my fish? 🐟",
  "Can you scratch my ears? 😸",
  "*stretches*",
  "*licks paws*",
  "I love this subreddit! ❤️",
  "Wandering around...",
  "Napping in the sun... ☀️"
];

interface PlaypenKittenState {
  id: string;
  x: number;
  targetX: number;
  isWalking: boolean;
  isFlipped: boolean;
  speed: number;
  speechTimeout: any;
  behavior: 'wandering' | 'napping' | 'grooming' | 'staring' | 'chasing';
  behaviorTimer: number; // ticks left for current behavior
}

const playpenStates = new Map<string, PlaypenKittenState>();

const BEHAVIOR_SPEECHES: Record<string, string[]> = {
  napping: [
    "Zzz... 💤",
    "Zzz... purr... 😻",
    "*sleeping in a warm sunbeam*",
    "*quiet snores*",
    "Purrr... 💤"
  ],
  grooming: [
    "*licks paws*",
    "*cleans face*",
    "*stretches paws*",
    "*smooths fur*",
    "Looking neat! ✨"
  ],
  chasing: [
    "A red dot! Chasing! 🔴",
    "Watch me jump! 🧶",
    "Got the dust bunny!",
    "Zoomies! 💨",
    "*pounces!*"
  ],
  staring: [
    "*stares blankly at you*",
    "Do you have food? 🐟",
    "Are you coding? 💻",
    "Pet me? 🥺",
    "What's that noise? 👂"
  ],
  wandering: [
    "Exploring the playpen... 🐾",
    "Wandering around...",
    "Sniffing the carpet...",
    "Looking for toys! 🧸"
  ]
};

function renderPlaypen() {
  // Clear any existing playpen kittens
  const existingKittens = document.querySelectorAll(".playpen-kitten");
  existingKittens.forEach(el => el.remove());
  
  // Hide the old single visual container and bubble
  kittenVisual.style.display = "none";
  petSpeech.style.display = "none";

  if (kittensList.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "playpen-kitten";
    emptyMsg.style.left = "42%";
    emptyMsg.style.bottom = "15px";
    emptyMsg.innerHTML = `<span style="font-size: 3rem; opacity: 0.5;">💤</span>`;
    particleEmitter.parentElement?.insertBefore(emptyMsg, particleEmitter);
    return;
  }

  // Render each active kitten in the playpen
  kittensList.forEach((k) => {
    let state = playpenStates.get(k.id);
    if (!state) {
      const initialX = 15 + Math.random() * 60;
      state = {
        id: k.id,
        x: initialX,
        targetX: initialX,
        isWalking: false,
        isFlipped: Math.random() > 0.5,
        speed: 0.12 + Math.random() * 0.1,
        speechTimeout: null,
        behavior: 'wandering',
        behaviorTimer: 30 + Math.random() * 40,
      };
      playpenStates.set(k.id, state);
    }

    const kDiv = document.createElement("div");
    // Class includes behavior for CSS animations
    kDiv.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""}`;
    kDiv.setAttribute("data-id", k.id);
    kDiv.style.left = `${state.x}%`;

    const flipStyle = state.isFlipped ? "transform: scaleX(-1);" : "transform: scaleX(1);";
    
    // Napping override: show sleeping eyes
    const renderEyes = state.behavior === "napping" ? "sleeping" : k.eyes;

    kDiv.innerHTML = `
      <div class="kitten-speech-bubble hidden">
        <span>Meow!</span>
      </div>
      <div class="kitten-svg-wrapper" style="${flipStyle}">
        ${getKittenSvg(k.color, renderEyes, k.stage === "cat")}
      </div>
    `;

    // Click handler to select this kitten
    kDiv.addEventListener("click", () => {
      selectedKitten = k;
      renderLitterList();
      renderPlaypen();
      updateActivePetDisplay();
    });

    // Insert before the particle emitter
    particleEmitter.parentElement?.insertBefore(kDiv, particleEmitter);
  });
}

function showKittenSpeech(kittenId: string, text: string) {
  const kEl = document.querySelector(`.playpen-kitten[data-id="${kittenId}"]`);
  if (!kEl) return;
  const bubble = kEl.querySelector(".kitten-speech-bubble") as HTMLDivElement;
  const textSpan = bubble?.querySelector("span");
  if (!bubble || !textSpan) return;

  textSpan.textContent = text;
  bubble.classList.remove("hidden");

  const state = playpenStates.get(kittenId);
  if (state) {
    if (state.speechTimeout) clearTimeout(state.speechTimeout);
    state.speechTimeout = setTimeout(() => {
      bubble.classList.add("hidden");
    }, 3500);
  }
}

// Autonomous Walking & Actions Loop (runs every 100ms)
setInterval(() => {
  kittensList.forEach((k) => {
    const state = playpenStates.get(k.id);
    if (!state) return;

    const el = document.querySelector(`.playpen-kitten[data-id="${k.id}"]`) as HTMLDivElement;
    if (!el) return;

    const svgWrap = el.querySelector(".kitten-svg-wrapper") as HTMLDivElement;

    // 1. Behavior State Machine Ticker
    state.behaviorTimer--;
    if (state.behaviorTimer <= 0) {
      // Pick new behavior state
      const roll = Math.random();
      let nextBehavior: 'wandering' | 'napping' | 'grooming' | 'staring' | 'chasing';
      
      if (roll < 0.35) {
        nextBehavior = 'wandering';
        state.behaviorTimer = 40 + Math.floor(Math.random() * 50); // 4-9s
        state.targetX = 15 + Math.random() * 60;
        state.isWalking = true;
        state.speed = 0.12 + Math.random() * 0.08;
      } else if (roll < 0.6) {
        nextBehavior = 'napping';
        state.behaviorTimer = 80 + Math.floor(Math.random() * 100); // 8-18s
        state.isWalking = false;
      } else if (roll < 0.75) {
        nextBehavior = 'grooming';
        state.behaviorTimer = 40 + Math.floor(Math.random() * 40); // 4-8s
        state.isWalking = false;
      } else if (roll < 0.9) {
        nextBehavior = 'staring';
        state.behaviorTimer = 30 + Math.floor(Math.random() * 30); // 3-6s
        state.isWalking = false;
      } else {
        nextBehavior = 'chasing';
        state.behaviorTimer = 25 + Math.floor(Math.random() * 30); // 2.5-5.5s
        state.targetX = 15 + Math.random() * 60;
        state.isWalking = true;
        state.speed = 0.35 + Math.random() * 0.1; // Fast speed boost!
      }

      state.behavior = nextBehavior;
      
      // Update DOM classes for CSS animations
      el.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""}`;
      
      // Re-render SVG to show correct eyes
      const renderEyes = state.behavior === "napping" ? "sleeping" : k.eyes;
      if (svgWrap) {
        svgWrap.innerHTML = getKittenSvg(k.color, renderEyes, k.stage === "cat");
      }

      // 60% chance to say something about new behavior
      if (Math.random() < 0.6) {
        const pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
        const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
        showKittenSpeech(k.id, randomText);
      }
    }

    // 2. Perform Movement
    if (state.isWalking) {
      const delta = state.targetX - state.x;
      if (Math.abs(delta) < 1) {
        // Arrived at target!
        state.isWalking = false;
        state.x = state.targetX;
        
        // 20% chance to speak on arrival
        if (Math.random() < 0.2) {
          const pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
          const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
          showKittenSpeech(k.id, randomText);
        }
      } else {
        // Walk!
        state.x += Math.sign(delta) * state.speed;
        state.isFlipped = delta < 0; // Flip visual depending on direction
        el.style.left = `${state.x}%`;
        if (svgWrap) {
          svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
        }
      }
    } else {
      // Sitting still
      // 0.4% chance to meow/speak while sitting
      if (Math.random() < 0.004) {
        const pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
        const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
        showKittenSpeech(k.id, randomText);
      }
    }
  });
}, 100);

// Initial Load & Polling Ticker
fetchInit();
setInterval(fetchInit, 20000); // Poll server every 20 seconds
