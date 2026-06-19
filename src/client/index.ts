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
function getKittenSvg(color: string, eyesType: string, isCat: boolean): string {
  let eyesSvg = "";
  switch (eyesType) {
    case "happy":
      eyesSvg = `
        <path d="M 35 46 Q 40 40 45 46" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 55 46 Q 60 40 65 46" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
      `;
      break;
    case "sad":
      eyesSvg = `
        <path d="M 35 48 Q 40 43 45 48" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 55 48 Q 60 43 65 48" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 33 42 L 39 44" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        <path d="M 67 42 L 61 44" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      `;
      break;
    case "sleeping":
      eyesSvg = `
        <line x1="34" y1="46" x2="44" y2="46" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="56" y1="46" x2="66" y2="46" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
      `;
      break;
    case "normal":
    default:
      eyesSvg = `
        <circle cx="39" cy="46" r="4.5" fill="#1e293b"/>
        <circle cx="61" cy="46" r="4.5" fill="#1e293b"/>
        <circle cx="37.5" cy="44.5" r="1.5" fill="white"/>
        <circle cx="59.5" cy="44.5" r="1.5" fill="white"/>
      `;
      break;
  }

  const scale = isCat ? "scale(1.18)" : "scale(1)";
  const translate = isCat ? "translate(-8, -13)" : "translate(0, 0)";
  
  return `
    <svg viewBox="0 0 100 100" class="svg-kitten" style="transform: ${translate} ${scale};">
      <!-- Tail -->
      <path d="M 72 80 Q 86 68 81 48 Q 76 38 83 28" stroke="${color}" stroke-width="6.5" stroke-linecap="round" fill="none"/>
      
      <!-- Body -->
      <ellipse cx="50" cy="73" rx="25" ry="17" fill="${color}" stroke="#1e293b" stroke-width="2.5"/>
      <ellipse cx="50" cy="75" rx="18" ry="11" fill="rgba(255,255,255,0.2)"/>
      
      <!-- Paws -->
      <circle cx="35" cy="88" r="6" fill="${color}" stroke="#1e293b" stroke-width="2"/>
      <circle cx="45" cy="89" r="6" fill="${color}" stroke="#1e293b" stroke-width="2"/>
      <circle cx="55" cy="89" r="6" fill="${color}" stroke="#1e293b" stroke-width="2"/>
      <circle cx="65" cy="88" r="6" fill="${color}" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Ears -->
      <polygon points="24,34 13,8 39,24" fill="${color}" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="26,32 19,13 36,24" fill="#FFB7B2"/>
      
      <polygon points="76,34 87,8 61,24" fill="${color}" stroke="#1e293b" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="74,32 81,13 64,24" fill="#FFB7B2"/>
      
      <!-- Head -->
      <ellipse cx="50" cy="45" rx="27" ry="21" fill="${color}" stroke="#1e293b" stroke-width="2.5"/>
      
      <!-- Cheeks -->
      <circle cx="31" cy="53" r="4.5" fill="#FF9AA2" opacity="0.65"/>
      <circle cx="69" cy="53" r="4.5" fill="#FF9AA2" opacity="0.65"/>
      
      <!-- Whiskers -->
      <line x1="22" y1="51" x2="7" y2="49" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="22" y1="54" x2="5" y2="55" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
      
      <line x1="78" y1="51" x2="93" y2="49" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="78" y1="54" x2="95" y2="55" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
      
      <!-- Eyes -->
      ${eyesSvg}
      
      <!-- Nose & Mouth -->
      <polygon points="48,51 52,51 50,53" fill="#ff6b6b"/>
      <path d="M 47 55 Q 50 58 50 55 Q 50 58 53 55" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
      
      <!-- Collar for Mature Cats -->
      ${isCat ? `
        <path d="M 33 59 Q 50 64 67 59" stroke="#f43f5e" stroke-width="5" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="63" r="4.5" fill="#fbbf24" stroke="#1e293b" stroke-width="1.2"/>
      ` : ""}
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
  if (!selectedKitten) {
    petName.textContent = "Adopt a Kitten!";
    petStageBadge.classList.add("hidden");
    petOwner.textContent = "u/-";
    kittenVisual.innerHTML = `<span style="font-size: 3rem; opacity: 0.5;">💤</span>`;
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

  // Draw Pet Visual
  const isCat = selectedKitten.stage === "cat";
  let expr = selectedKitten.eyes;
  
  // Set shiver shake class if neglected
  kittenVisual.className = "kitten-sprite";
  if (selectedKitten.neglectedSince !== null) {
    kittenVisual.classList.add("anim-neglected");
  }

  kittenVisual.innerHTML = getKittenSvg(selectedKitten.color, expr, isCat);

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
        🐱
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
      <span>🐱</span>
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
    updateActivePetDisplay();
  } catch (err) {
    console.error("Error during initial state sync:", err);
  }
}

// Perform Care Action
async function performCareAction(actionType: CareActionType) {
  if (!selectedKitten) return;
  
  // Visual Trigger
  kittenVisual.classList.add(`anim-${actionType}`);
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
    updateActivePetDisplay();
    
    hudActions.textContent = data.profile.actionsPerformed.toString();
  } catch (err) {
    console.error("Action error:", err);
  } finally {
    // Clear animation classes
    setTimeout(() => {
      kittenVisual.classList.remove(`anim-${actionType}`);
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

function showSpeechBubble(text: string) {
  if (!selectedKitten) return;
  petSpeechText.textContent = text;
  petSpeech.classList.remove("hidden");
  
  setTimeout(() => {
    petSpeech.classList.add("hidden");
  }, 3500);
}

// Background autonomous behaviors ticker (every 8 seconds)
setInterval(() => {
  if (!selectedKitten) return;
  if (selectedKitten.stage === "cat") return; // Cats are chilling, only kittens do crazy stuff!
  
  // 35% chance to perform an action on any tick
  if (Math.random() > 0.35) return;

  const actionRoll = Math.random();
  if (actionRoll < 0.5) {
    // Show random cute thoughts/meows
    const randomText = AUTONOMOUS_SPEECHES[Math.floor(Math.random() * AUTONOMOUS_SPEECHES.length)] || "Meow!";
    showSpeechBubble(randomText);
  } else if (actionRoll < 0.8) {
    // Wander movement action
    const shiftPercent = Math.floor(Math.random() * 60) - 30; // Shift -30px to +30px
    kittenVisual.style.transform = `translateX(${shiftPercent}px)`;
    
    showSpeechBubble("Exploring! 🐾");
    
    setTimeout(() => {
      kittenVisual.style.transform = "none";
    }, 3000);
  } else {
    // Expression blip (temporary blink/sleep)
    const isCat = selectedKitten.stage === "cat";
    const originalEyes = selectedKitten.eyes;
    
    kittenVisual.innerHTML = getKittenSvg(selectedKitten.color, "sleeping", isCat);
    
    setTimeout(() => {
      if (selectedKitten) {
        kittenVisual.innerHTML = getKittenSvg(selectedKitten.color, originalEyes, isCat);
      }
    }, 1500);
  }
}, 8000);

// Initial Load & Polling Ticker
fetchInit();
setInterval(fetchInit, 20000); // Poll server every 20 seconds
