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
  type KittenPersonality,
  PERSONALITY_MAP,
  SHOP_ACCESSORIES,
  SHOP_TOYS,
} from "../shared/api.ts";

// Client-side Offline Mock Mode Interceptor
if (window.location.search.includes("mock=true") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  const originalFetch = window.fetch;
  
  const mockState = {
    username: "Player123",
    subredditName: "kittehgotchi_dev",
    isModerator: true,
    kittens: [
      {
        id: "mock_k1",
        name: "Smudge",
        stage: "kitten" as const,
        color: "#ffffff",
        eyes: "normal",
        bornAt: Date.now() - 3600000,
        hunger: 80,
        happiness: 80,
        cleanliness: 80,
        neglectedSince: null,
        originSubreddit: "kittehgotchi_dev",
        ownerUser: "Player123",
        personality: "smudge" as const,
        isSick: false
      },
      {
        id: "mock_k2",
        name: "Zen",
        stage: "kitten" as const,
        color: "#cbd5e1",
        eyes: "sleeping",
        bornAt: Date.now() - 7200000,
        hunger: 90,
        happiness: 90,
        cleanliness: 40,
        neglectedSince: null,
        originSubreddit: "kittehgotchi_dev",
        ownerUser: "Player123",
        personality: "shironeko" as const,
        isSick: false
      }
    ] as Kitten[],
    cats: [] as Kitten[],
    logs: [
      { id: "log_1", text: "Welcome to Kittehgotchi Sanctuary! 🐱", timestamp: Date.now() }
    ] as GameLog[],
    profile: {
      username: "Player123",
      actionsPerformed: 5,
      hasPlayedBefore: true,
      pawCoins: 100,
      unlockedAccessories: [] as string[],
      unlockedToys: [] as string[],
    } as PlayerProfile,
    leaderboard: [
      { username: "Player123", score: 5 },
      { username: "ModKitty", score: 42 }
    ],
    litterbox: 2
  };

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : (input as Request).url);
    console.log("[MOCK FETCH]", url, init);
    
    if (url.includes("/api/init")) {
      const resp: InitResponse = {
        type: "init",
        postId: "mock_post",
        username: mockState.username,
        subredditName: mockState.subredditName,
        isModerator: mockState.isModerator,
        kittens: mockState.kittens,
        cats: mockState.cats,
        logs: mockState.logs,
        profile: mockState.profile,
        leaderboard: mockState.leaderboard,
        litterbox: mockState.litterbox
      };
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (url.includes("/api/spawn-stray")) {
      const names = ["Socks", "Luna", "Crookshanks", "Marie", "Jiji", "Jonesy", "Tigger", "Mochi", "Oliver", "Bella", "Simba"];
      const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444", "#a855f7", "#ffffff", "#cbd5e1"];
      const personalities: KittenPersonality[] = ["smudge", "venus", "colonel_meow", "nala", "shironeko"];
      
      const newKitten: Kitten = {
        id: "mock_stray_" + Math.random().toString(36).substr(2, 9),
        name: names[Math.floor(Math.random() * names.length)],
        stage: "kitten",
        color: colors[Math.floor(Math.random() * colors.length)],
        eyes: "normal",
        bornAt: Date.now(),
        hunger: 100,
        happiness: 100,
        cleanliness: 100,
        neglectedSince: null,
        originSubreddit: mockState.subredditName,
        ownerUser: mockState.username,
        personality: personalities[Math.floor(Math.random() * personalities.length)] as KittenPersonality,
        isSick: false
      };
      mockState.kittens.push(newKitten);
      mockState.logs.unshift({ id: "log_" + Date.now(), text: `A new stray kitten named ${newKitten.name} wandered in!`, timestamp: Date.now() });
      
      const resp = {
        kittens: mockState.kittens,
        cats: mockState.cats,
        litterbox: mockState.litterbox,
        logs: mockState.logs
      };
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (url.includes("/api/action")) {
      const body = JSON.parse(init?.body as string || "{}") as ActionRequest;
      const kId = body.kittenId;
      const action = body.action;
      const targetId = body.targetId;
      
      mockState.profile.actionsPerformed++;
      mockState.leaderboard[0].score = mockState.profile.actionsPerformed;
      
      if (action === "buy_accessory") {
        const item = SHOP_ACCESSORIES.find(a => a.id === targetId);
        if (item && mockState.profile.pawCoins >= item.cost) {
          mockState.profile.pawCoins -= item.cost;
          mockState.profile.unlockedAccessories.push(targetId!);
          mockState.logs.unshift({ id: "log_" + Date.now(), text: `u/${mockState.username} bought the ${item.name} accessory!`, timestamp: Date.now() });
        }
      } else if (action === "equip_accessory") {
        const kit = mockState.kittens.find(x => x.id === kId) || mockState.cats.find(x => x.id === kId);
        if (kit) {
          kit.accessory = targetId;
          const item = SHOP_ACCESSORIES.find(a => a.id === targetId);
          mockState.logs.unshift({ id: "log_" + Date.now(), text: `u/${mockState.username} dressed ${kit.name} in a ${item?.name || targetId}!`, timestamp: Date.now() });
        }
      } else if (action === "unequip_accessory") {
        const kit = mockState.kittens.find(x => x.id === kId) || mockState.cats.find(x => x.id === kId);
        if (kit) {
          kit.accessory = null;
          mockState.logs.unshift({ id: "log_" + Date.now(), text: `u/${mockState.username} removed accessories from ${kit.name}`, timestamp: Date.now() });
        }
      } else if (action === "buy_toy") {
        const item = SHOP_TOYS.find(t => t.id === targetId);
        if (item && mockState.profile.pawCoins >= item.cost) {
          mockState.profile.pawCoins -= item.cost;
          mockState.profile.unlockedToys.push(targetId!);
          mockState.logs.unshift({ id: "log_" + Date.now(), text: `u/${mockState.username} unlocked the ${item.name} for the playpen!`, timestamp: Date.now() });
        }
      } else if (kId === "global" && action === "clean") {
        mockState.litterbox = 0;
        mockState.profile.pawCoins += 15;
        mockState.logs.unshift({ id: "log_" + Date.now(), text: `u/${mockState.username} cleaned the litterbox! 🧼`, timestamp: Date.now() });
      } else {
        const kit = mockState.kittens.find(x => x.id === kId) || mockState.cats.find(x => x.id === kId);
        if (kit) {
          mockState.profile.pawCoins += 5;
          if (action === "feed") {
            kit.hunger = Math.min(100, kit.hunger + 30);
            mockState.logs.unshift({ id: "log_" + Date.now(), text: `Fed ${kit.name} some fish! 🐟`, timestamp: Date.now() });
          } else if (action === "play") {
            kit.happiness = Math.min(100, kit.happiness + 25);
            mockState.logs.unshift({ id: "log_" + Date.now(), text: `Played with ${kit.name}! 🧶`, timestamp: Date.now() });
          } else if (action === "treat") {
            kit.happiness = Math.min(100, kit.happiness + 40);
            kit.hunger = Math.min(100, kit.hunger + 10);
            mockState.logs.unshift({ id: "log_" + Date.now(), text: `Gave ${kit.name} a treat! 🍪`, timestamp: Date.now() });
          } else if (action === "medicine") {
            kit.isSick = false;
            mockState.logs.unshift({ id: "log_" + Date.now(), text: `Gave ${kit.name} medicine! 💊`, timestamp: Date.now() });
          } else if (action === "pet") {
            kit.happiness = Math.min(100, kit.happiness + 15);
            mockState.logs.unshift({ id: "log_" + Date.now(), text: `Petted ${kit.name}! ❤️`, timestamp: Date.now() });
          }
        }
      }
      
      const resp: ActionResponse = {
        success: true,
        message: "Action mock success",
        kittens: mockState.kittens,
        cats: mockState.cats,
        logs: mockState.logs,
        profile: mockState.profile,
        leaderboard: mockState.leaderboard,
        litterbox: mockState.litterbox
      };
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (url.includes("/api/rename")) {
      const body = JSON.parse(init?.body as string || "{}") as RenameRequest;
      const kit = mockState.kittens.find(x => x.id === body.kittenId) || mockState.cats.find(x => x.id === body.kittenId);
      if (kit) {
        const oldName = kit.name;
        kit.name = body.newName;
        mockState.logs.unshift({ id: "log_" + Date.now(), text: `Renamed ${oldName} to ${kit.name}! ✏️`, timestamp: Date.now() });
      }
      const resp: RenameResponse = {
        success: true,
        message: "Rename mock success",
        kittens: mockState.kittens
      };
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    
    if (url.includes("/api/time-warp")) {
      const body = JSON.parse(init?.body as string || "{}") as TimeWarpRequest;
      const hours = body.hours;
      
      mockState.kittens.forEach(k => {
        k.hunger = Math.max(0, k.hunger - hours * 5);
        k.happiness = Math.max(0, k.happiness - hours * 4);
        k.cleanliness = Math.max(0, k.cleanliness - hours * 6);
        if (k.cleanliness < 35 && Math.random() < 0.35) {
          k.isSick = true;
        }
        // Grow to cat if 72 hours warp
        if (hours >= 72 && k.stage === "kitten") {
          k.stage = "cat";
          mockState.logs.unshift({ id: "log_" + Date.now(), text: `🎉 ${k.name} grew up into a mature cat!`, timestamp: Date.now() });
        }
      });
      
      mockState.litterbox = Math.min(10, mockState.litterbox + Math.floor(hours * 0.5));
      mockState.logs.unshift({ id: "log_" + Date.now(), text: `🛡️ Time warped by +${hours}h!`, timestamp: Date.now() });
      
      const resp: TimeWarpResponse = {
        success: true,
        message: "Time warp mock success",
        kittens: mockState.kittens,
        cats: mockState.cats,
        logs: mockState.logs
      };
      return new Response(JSON.stringify(resp), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return originalFetch(input, init);
  };
}

// State
let kittensList: Kitten[] = [];
let catsList: Kitten[] = [];
let selectedKitten: Kitten | null = null;
let currentUsername = "";
let isModerator = false;
let roomLitterbox = 0;
let playerCoins = 100;
let unlockedAccessories: string[] = [];
let unlockedToys: string[] = [];
let activeShopTab: "accessories" | "toys" = "accessories";

// Mini-games State
let isMedicineChaseActive = false;
let medicineClicks = 0;
let chasedKittenId = "";
let mouseXPercent = 50;

// DOM Elements
const hudSubreddit = document.getElementById("hud-subreddit") as HTMLSpanElement;
const hudUsername = document.getElementById("hud-username") as HTMLSpanElement;
const hudActions = document.getElementById("hud-actions") as HTMLSpanElement;
const hudCoinsTop = document.getElementById("hud-coins-top") as HTMLSpanElement;
const hudCoins = document.getElementById("hud-coins") as HTMLSpanElement;
const shopItemsGrid = document.getElementById("shop-items-grid") as HTMLDivElement;
const shopTabAccessories = document.getElementById("shop-tab-accessories") as HTMLButtonElement;
const shopTabToys = document.getElementById("shop-tab-toys") as HTMLButtonElement;

const kittenCardsContainer = document.getElementById("kitten-list") as HTMLDivElement;
const sanctuaryGallery = document.getElementById("sanctuary-gallery") as HTMLDivElement;
const activityLog = document.getElementById("activity-log") as HTMLDivElement;
const leaderboardList = document.getElementById("leaderboard-list") as HTMLDivElement;

const petName = document.getElementById("pet-name") as HTMLHeadingElement;
const petStageBadge = document.getElementById("pet-stage-badge") as HTMLSpanElement;
const petPersonalityBadge = document.getElementById("pet-personality-badge") as HTMLSpanElement;
const petPersonalityDesc = document.getElementById("pet-personality-desc") as HTMLParagraphElement;
const petOwner = document.getElementById("pet-owner") as HTMLSpanElement;
const kittenVisual = document.getElementById("kitten-visual") as HTMLDivElement;
const petSpeech = document.getElementById("pet-speech") as HTMLDivElement;
const petSpeechText = document.getElementById("pet-speech-text") as HTMLSpanElement;
const btnSummonStray = document.getElementById("btn-summon-stray") as HTMLButtonElement;
const particleEmitter = document.getElementById("particle-emitter") as HTMLDivElement;
const statusBalloon = document.getElementById("status-balloon") as HTMLDivElement;
const playpenViewport = document.querySelector(".playpen-viewport") as HTMLDivElement;

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
const btnTreat = document.getElementById("btn-treat") as HTMLButtonElement;

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
const PIXEL_ART_FRAMES = {
  stand: [
    "........................",
    "........................",
    "....dddd........dddd....",
    "...dhhhhd......dhhhhd...",
    "..dhhhhhkd....kdhhhhkd..",
    "..dhhhhkkddddddkkkkkkd..",
    "..dhhhhkkkkkkkkkkkkksd..",
    "..dhhhhkkkkkkkkkkkkksd..",
    ".dhhhhkkkkkkkkkkkkkkssd.",
    ".dhhhkkddddkkkkddddkssd.",
    ".dhhhkkdeddkkkkdeddkssd.",
    ".dhhhhkkddkkkkkkddkkssd.",
    "..dhhhhkkkkppppkkkkssd..",
    "...dhhhhkkddddkkkkssd...",
    "....ddddkkkkkkkkddss....",
    "......dkkkkkkkkkksd.....",
    ".....dhhwwwwwwwwkkd.....",
    ".....dhhwwwwwwwwkkd..dd.",
    ".....dhhkkkkkkkkksd.dkkd",
    ".....dhhkkkkkkkkksddkkd.",
    "......dkkkkkkkkkksdkkd..",
    "......dkkdkkkkkkdkkdd...",
    "......ddddd....ddddd....",
    "........................"
  ],
  walk1: [
    "........................",
    "........................",
    "..........dddd..........",
    ".........dhhhkd..dddd...",
    "........dhhhhhkd.dhhkd..",
    "........dhhhhhkdddhhkd..",
    "........dhhdeddkkkkkksd.",
    "........dhhhddkkkkkkksd.",
    ".........dhhkkppppkkksd.",
    "..........dhhkddkkkksd..",
    "...........dddkkkdds....",
    ".........dddkkkkkkkddd..",
    "........dhhkkkkkkkkkksd.",
    ".......dhhkkkkkkkkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.dd",
    "......dhhkkkkkkkkkkkkkkddkd",
    ".......dkkkkkkkkkkkkkkdkkd",
    ".......dkkkkkkkkkkkkkdkkd.",
    ".......dkkdkkkkkkdkkddkd..",
    ".......dkkd....dkkd..dd...",
    ".......dkkd.....dkkd......",
    ".......ddd......ddd.......",
    "........................"
  ],
  walk2: [
    "........................",
    "........................",
    "..........dddd..........",
    ".........dhhhkd..dddd...",
    "........dhhhhhkd.dhhkd..",
    "........dhhhhhkdddhhkd..",
    "........dhhdeddkkkkkksd.",
    "........dhhhddkkkkkkksd.",
    ".........dhhkkppppkkksd.",
    "..........dhhkddkkkksd..",
    "...........dddkkkdds....",
    ".........dddkkkkkkkddd..",
    "........dhhkkkkkkkkkksd.",
    ".......dhhkkkkkkkkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.dd",
    "......dhhkkkkkkkkkkkkkkddkd",
    ".......dkkkkkkkkkkkkkkdkkd",
    ".......dkkkkkkkkkkkkkdkkd.",
    "........dkkdkkkkkkdkkddkd.",
    "........dkkd....dkkd..dd..",
    ".........dkkd....dkkd.....",
    ".........ddd......ddd.....",
    "........................"
  ],
  sleep: [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "..........dddddd........",
    "........ddhhhhhhdd......",
    "......ddhhhhhkkkkkdd....",
    ".....dhhhhhkkkkkkkkksd..",
    "....dhhhhhkkkkkkkkkkksd.",
    "....dhhdeddkkkdeddkksd..",
    "....dhhhddkkkkkddkkksd..",
    "....dhhhhkkkkkkkkkkksd..",
    ".....dkkkkkkkkkkkkkksd..",
    "......ddkkkkkkkkkkssd...",
    "........dddddddddd......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  eat: [
    "........................",
    "........................",
    "........................",
    "........................",
    "..........dddd..........",
    ".........dhhhkd..dddd...",
    "........dhhhhhkd.dhhkd..",
    "........dhhhhhkdddhhkd..",
    "........dhhdeddkkkkkksd.",
    "........dhhhddkkkkkkksd.",
    ".........dhhkkppppkkksd.",
    "..........dhhkddkkkksd..",
    "...........dddkkkdds....",
    ".........dddkkkkkkkddd..",
    "........dhhkkkkkkkkkksd.",
    ".......dhhkkkkkkkkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.dd",
    "......dhhwwwwwwwwkkkkksddkd",
    "......dhhkkkkkkkkkkkkkkdkkd",
    ".......dkkkkkkkkkkkkkkdkkd.",
    ".......dkkdkkkkkkdkkdddkd..",
    ".......dkkd....dkkd..dd....",
    ".......ddd......ddd........",
    "........................"
  ],
  scratch: [
    "........................",
    "..........dddd..........",
    ".........dhhhkd..dddd...",
    "........dhhhhhkd.dhhkd..",
    "........dhhhhhkdddhhkd..",
    "........dhhdeddkkkkkksd.",
    "........dhhhddkkkkkkksd.",
    ".........dhhkkppppkkksd.",
    "..........dhhkddkkkksd..",
    "...........dddkkkdds....",
    ".........dddkkkkkkkddd..",
    "........dhhkkkkkkkkkksd.",
    ".......dhhkkkkkkkkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.",
    "......dhhwwwwwwwwkkkkksd.",
    "......dhhkkkkkkkkkkkkkkd.",
    "......dhhkkkkkkkkkkkkkkd.dd",
    ".......dkkkkkkkkkkkkkkkddkd",
    ".......dkkkkkkkkkkkkkkkdkkd",
    ".......dkkdkkkkkkdkkdddkkd.",
    ".......dkkd....dkkd..ddkd..",
    ".......dkkd....dkkd...dd...",
    ".......ddd......ddd........",
    "........................"
  ],
  play: [
    "........................",
    "..........dddd..........",
    ".........dhhhkd..dddd...",
    "........dhhhhhkd.dhhkd..",
    "........dhhhhhkdddhhkd..",
    "........dhhdeddkkkkkksd.",
    "........dhhhddkkkkkkksd.",
    ".........dhhkkppppkkksd.",
    "..........dhhkddkkkksd..",
    "...........dddkkkdds....",
    ".........dddkkkkkkkddd..",
    "........dhhkkkkkkkkkksd.dd",
    ".......dhhkkkkkkkkkkkksddkd",
    "......dhhwwwwwwwwkkkkksdkkd",
    "......dhhwwwwwwwwkkkkksddkd",
    "......dhhkkkkkkkkkkkkkkddkd",
    ".......dkkkkkkkkkkkkkkkdkkd",
    ".......dkkkkkkkkkkkkkkdkkd.",
    ".......dkkdkkkkkkdkkdddkd..",
    ".......dkkd....dkkd..dd....",
    ".......ddd......ddd........",
    "........................",
    "........................",
    "........................"
  ]
};

const HEAD_GRID = [
  "........................",
  "........................",
  "....dddd........dddd....",
  "...dhhhhd......dhhhhd...",
  "..dhhhhhkd....kdhhhhkd..",
  "..dhhhhkkddddddkkkkkkd..",
  "..dhhhhkkkkkkkkkkkkksd..",
  "..dhhhhkkkkkkkkkkkkksd..",
  ".dhhhhkkkkkkkkkkkkkkssd.",
  ".dhhhkkddddkkkkddddkssd.",
  ".dhhhkkdeddkkkkdeddkssd.",
  ".dhhhhkkddkkkkkkddkkssd.",
  "..dhhhhkkkkppppkkkkssd..",
  "...dhhhhkkddddkkkkssd...",
  "....ddddkkkkkkkkddss....",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................"
];

const ACCESSORIES_ART: Record<string, string[]> = {
  wizard_hat: [
    "........................",
    "............u...........",
    "...........uuu..........",
    "..........uyyuu.........",
    ".........uuuuuyy........",
    "........uuyyuuuu........",
    ".......uuuuuuuuuu.......",
    "......uuuuuuuuyyy.......",
    ".....ddddddddddddd......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  crown: [
    "........................",
    "........................",
    ".........g.g.g..........",
    "........ggggggg.........",
    "........gbbgbbg.........",
    ".......ddddddddd........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  party_hat: [
    "........................",
    "............w...........",
    "...........rwr..........",
    "..........rbwbr.........",
    ".........rbrbwr.........",
    "........rbwbwbr.........",
    ".......rbrbrbwr.........",
    "......ddddddddddd.......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  bowtie: [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "...........r.r..........",
    "..........rrrrr.........",
    "...........rrr..........",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ],
  sunglasses: [
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "......eeeeedeeeeed......",
    "......eeeeedeeeeed......",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................",
    "........................"
  ]
};

function darkenColor(hex: string, percent: number): string {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = (num >> 8 & 0x00FF) - amt,
    B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 + (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 + (B < 0 ? 0 : B > 255 ? 255 : B)).toString(16).slice(1);
}

function getKittenSvg(
  color: string,
  eyesType: string,
  isCat: boolean,
  headOnly: boolean = false,
  viewDirection: 'front' | 'back' | 'side' = 'front',
  behavior: string = "stand",
  isWalking: boolean = false,
  accessory: string | null = null
): string {
  // Determine active frame
  let frameName: keyof typeof PIXEL_ART_FRAMES = 'stand';
  if (isWalking) {
    const walkStep = Math.floor(Date.now() / 200) % 2;
    frameName = walkStep === 0 ? 'walk1' : 'walk2';
  } else {
    switch (behavior) {
      case 'napping':
        frameName = 'sleep';
        break;
      case 'eating':
        frameName = 'eat';
        break;
      case 'scratching':
        frameName = 'scratch';
        break;
      case 'playing':
        frameName = 'play';
        break;
      default:
        frameName = 'stand';
        break;
    }
  }

  const grid = headOnly ? HEAD_GRID : PIXEL_ART_FRAMES[frameName];
  const shadowColor = darkenColor(color, 20);
  const highlightColor = darkenColor(color, -20);
  const accessoryArt = accessory ? ACCESSORIES_ART[accessory] : null;

  // Build SVG rect elements
  let rects = "";
  for (let r = 0; r < 24; r++) {
    const rowStr = grid[r];
    for (let c_idx = 0; c_idx < 24; c_idx++) {
      // Check if accessory pixel should be drawn here (with head offsets for side view)
      let accessoryChar = ".";
      if (accessoryArt && !headOnly) {
        let checkCol = c_idx;
        let checkRow = r;
        if (viewDirection === 'side') {
          checkCol = c_idx + 3; // Shift hat left for side-facing head
          if (behavior === 'eating') {
            checkRow = r - 2; // Shift hat up/down for lowered head
          }
        }
        if (accessoryArt[checkRow] && accessoryArt[checkRow][checkCol]) {
          accessoryChar = accessoryArt[checkRow][checkCol];
        }
      }

      const char = rowStr ? rowStr[c_idx] : ".";

      if (char === "." && accessoryChar === ".") continue; // Transparent

      let pixelColor = color;

      if (accessoryChar !== ".") {
        // Draw accessory pixel
        if (accessoryChar === "u") pixelColor = "#8b5cf6"; // Purple (wizard hat)
        else if (accessoryChar === "y") pixelColor = "#fef08a"; // Yellow stars
        else if (accessoryChar === "g") pixelColor = "#fbbf24"; // Gold crown
        else if (accessoryChar === "r") pixelColor = "#ef4444"; // Red (bowtie, party hat)
        else if (accessoryChar === "b") pixelColor = "#3b82f6"; // Blue jewels
        else if (accessoryChar === "e") pixelColor = "#1e293b"; // Sunglasses
        else if (accessoryChar === "w") pixelColor = "#ffffff"; // White
        else if (accessoryChar === "d") pixelColor = "#1a202c"; // Dark outline
      } else {
        // Draw cat pixel
        if (char === "k") {
          pixelColor = color;
        } else if (char === "s") {
          pixelColor = shadowColor;
        } else if (char === "h") {
          pixelColor = highlightColor;
        } else if (char === "p") {
          pixelColor = "#ffb4b4"; // Pink inner ears/nose
        } else if (char === "w") {
          pixelColor = "#ffffff"; // White belly/accents
        } else if (char === "e") {
          // Render eyes based on eyesType and positions
          if (eyesType === "sleeping" || eyesType === "happy" || eyesType === "sad") {
            pixelColor = "#1a202c"; // Closed/curve outline eye line
          } else {
            // Normal / Grumpy: add beautiful white pupil highlights
            if (c_idx === 7 || c_idx === 15) {
              pixelColor = "#ffffff"; // White pupil highlight
            } else {
              pixelColor = "#1a202c"; // Dark charcoal pupil
            }
          }
        } else if (char === "c") {
          pixelColor = isCat ? "#f43f5e" : color; // Red collar
        } else if (char === "b") {
          pixelColor = isCat ? "#fbbf24" : color; // Gold bell
        } else if (char === "d") {
          pixelColor = "#1a202c"; // Dark outline
        }
      }

      rects += `<rect x="${c_idx}" y="${r}" width="1" height="1" fill="${pixelColor}" />`;
    }
  }

  // Set viewBox: zoom in on the head for headOnly icons
  const viewBox = headOnly ? "2 2 20 13" : "0 0 24 24";
  const scale = headOnly ? "scale(1)" : (isCat ? "scale(1.15)" : "scale(0.85)");
  const translate = "translate(0, 0)";

  return `
    <svg viewBox="${viewBox}" width="100%" height="100%" class="svg-kitten" shape-rendering="crispEdges">
      <g style="transform-origin: 12px 12px; transform: ${translate} ${scale};">
        ${rects}
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

  updateFloorPoops(roomLitterbox);

  if (!selectedKitten) {
    petName.textContent = "Adopt a Kitten!";
    petStageBadge.classList.add("hidden");
    petPersonalityBadge.classList.add("hidden");
    petPersonalityDesc.classList.add("hidden");
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
    btnClean.disabled = isMedicineChaseActive;
    btnPet.disabled = true;
    btnTreat.disabled = true;
    btnRenameTrigger.classList.add("hidden");
    return;
  }

  // Set Details
  petName.textContent = selectedKitten.name;
  petStageBadge.textContent = selectedKitten.stage;
  petStageBadge.className = `badge ${selectedKitten.stage === "cat" ? "cat-stage" : ""}`;
  petStageBadge.classList.remove("hidden");
  petOwner.textContent = `u/${selectedKitten.ownerUser}`;

  if (selectedKitten.stage === "kitten") {
    const p = selectedKitten.personality || "shironeko";
    const meta = PERSONALITY_MAP[p];
    if (meta) {
      petPersonalityBadge.textContent = meta.displayName;
      petPersonalityBadge.classList.remove("hidden");
      petPersonalityDesc.textContent = meta.subtitle;
      petPersonalityDesc.classList.remove("hidden");
      
      const arch = meta.archetype;
      if (arch === "hyper") {
        petPersonalityBadge.style.background = "#f59e0b"; // Orange
      } else if (arch === "grumpy") {
        petPersonalityBadge.style.background = "#ef4444"; // Red
      } else if (arch === "shy") {
        petPersonalityBadge.style.background = "#10b981"; // Emerald
      } else {
        petPersonalityBadge.style.background = "#8b5cf6"; // Purple (Lazy)
      }
    } else {
      petPersonalityBadge.classList.add("hidden");
      petPersonalityDesc.classList.add("hidden");
    }
  } else {
    petPersonalityBadge.classList.add("hidden");
    petPersonalityDesc.classList.add("hidden");
  }

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
  if (selectedKitten.isSick) {
    statusBalloon.querySelector(".balloon-text")!.textContent = "Sick! 🤒 Needs medicine!";
    statusBalloon.classList.remove("hidden");
  } else if (selectedKitten.neglectedSince !== null) {
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
  const isCareDisabled = isCat || isMedicineChaseActive;
  btnFeed.disabled = isCareDisabled;
  btnPlay.disabled = isCareDisabled;
  btnTreat.disabled = isCareDisabled;
  btnClean.disabled = isMedicineChaseActive;
  
  if (selectedKitten.isSick) {
    btnPet.disabled = isMedicineChaseActive;
    btnPet.querySelector(".btn-icon-large")!.textContent = "💊";
    btnPet.querySelector(".btn-text")!.textContent = "Give Medicine";
    btnPet.classList.add("btn-medicine");
  } else {
    btnPet.disabled = isCareDisabled;
    btnPet.querySelector(".btn-icon-large")!.textContent = "❤️";
    btnPet.querySelector(".btn-text")!.textContent = "Pet Kitten";
    btnPet.classList.remove("btn-medicine");
  }
}

function updateFloorPoops(level: number) {
  const container = document.getElementById("floor-poops-container");
  if (!container) return;
  container.innerHTML = "";
  
  const count = Math.floor(level / 20);
  const positions = [15, 35, 55, 75, 90];
  for (let i = 0; i < count; i++) {
    const poop = document.createElement("div");
    poop.className = "floor-poop";
    poop.textContent = "💩";
    const leftOffset = positions[i] || (10 + Math.random() * 80);
    poop.style.left = `${leftOffset}%`;
    container.appendChild(poop);
  }
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
        ${getKittenSvg(k.color, "normal", false, true, "front", "stand", false, k.accessory)}
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
        ${getKittenSvg(c.color, "happy", true, true, "front", "stand", false, c.accessory)}
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
    roomLitterbox = data.litterbox || 0;

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

    // Coins and Shop
    playerCoins = data.profile.pawCoins ?? 100;
    unlockedAccessories = data.profile.unlockedAccessories ?? [];
    unlockedToys = data.profile.unlockedToys ?? [];
    if (hudCoinsTop) hudCoinsTop.textContent = playerCoins.toString();
    if (hudCoins) hudCoins.textContent = playerCoins.toString();

    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    renderLeaderboard(data.leaderboard);
    renderPlaypen();
    updateActivePetDisplay();
    renderShop();
    updateToysVisibility();
  } catch (err) {
    console.error("Error during initial state sync:", err);
  }
}

// Perform Care Action
async function performCareAction(actionType: CareActionType) {
  // Intercept mini-games
  if (actionType === "clean") {
    startLitterboxGame();
    return;
  }
  
  if (!selectedKitten) return;
  
  if (actionType === "pet" && selectedKitten.isSick) {
    startMedicineChase(selectedKitten.id);
    return;
  }
  
  await sendCareActionToServer(actionType);
}

// Actual network call and visual update for actions
async function sendCareActionToServer(actionType: CareActionType) {
  if (!selectedKitten && actionType !== "clean") return;
  
  // Instantly command the kitten to walk to the appropriate station!
  if (selectedKitten) {
    const state = playpenStates.get(selectedKitten.id);
    if (state) {
      state.climbPlatform = 'none'; // reset climbing when performing actions
       if (actionType === "feed") {
        state.behavior = "eating";
        state.targetX = 24; // Walk to Food Bowl (safe 24%)
        state.targetY = 45;
        state.isWalking = true;
        state.behaviorTimer = 60; // Stay for 6 seconds
      } else if (actionType === "play") {
        state.behavior = "playing";
        state.targetX = 62; // Walk to Yarn Ball
        state.targetY = 40;
        state.isWalking = true;
        state.behaviorTimer = 60;
      } else if (actionType === "treat") {
        state.behavior = "playing"; // Zoomies!
        state.isWalking = true;
        state.targetX = 18 + Math.random() * 64; // Run to random location
        state.targetY = 15 + Math.random() * 70;
        state.speed = 1.5; // High speed!
        state.behaviorTimer = 80;
        showKittenSpeech(selectedKitten.id, "⚡ TREAT TIME! ZOOMIES! ⚡");
      } else if (actionType === "pet") {
        state.behavior = "grooming";
        state.isWalking = false; // Interact in place
        state.behaviorTimer = 40;
      } else if (actionType === "medicine") {
        state.behavior = "grooming";
        state.isWalking = false;
        state.behaviorTimer = 40;
      }

      // Update direction and flip state
      if (state.isWalking) {
        const deltaX = state.targetX - state.x;
        const deltaY = state.targetY - state.y;
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          state.direction = deltaY > 0 ? 'back' : 'front';
          state.isFlipped = deltaX < 0;
        } else {
          state.direction = 'side';
          state.isFlipped = deltaX > 0;
        }
      } else {
        if (state.behavior === 'eating' || state.behavior === 'scratching' || state.behavior === 'playing') {
          state.direction = 'side';
          if (state.behavior === 'eating') state.isFlipped = state.x < 24;
          else if (state.behavior === 'scratching') state.isFlipped = state.x < 42;
          else if (state.behavior === 'playing') state.isFlipped = state.x < 62;
        } else {
          state.direction = 'front';
        }
      }
      
      // Instantly update visual state classes
      const el = document.querySelector(`.playpen-kitten[data-id="${selectedKitten.id}"]`) as HTMLDivElement;
      if (el) {
        el.className = `playpen-kitten ${state.behavior} selected personality-${PERSONALITY_MAP[selectedKitten.personality || 'shironeko'].archetype} ${state.isWalking ? 'walking' : ''}`;
      }
    }
  }
  
  let emoji = "❤️";
  if (actionType === "feed") emoji = "🐟";
  if (actionType === "play") emoji = "🧶";
  if (actionType === "treat") emoji = "🍪";
  if (actionType === "clean") emoji = "🧼";
  if (actionType === "medicine") emoji = "💖";
  
  triggerParticles(emoji);

  try {
    const reqBody: ActionRequest = {
      kittenId: selectedKitten ? selectedKitten.id : "global",
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
    roomLitterbox = data.litterbox || 0;
    
    // Update active kitten reference
    if (selectedKitten) {
      const matched = kittensList.find(x => x.id === selectedKitten!.id) || catsList.find(x => x.id === selectedKitten!.id);
      if (matched) {
        selectedKitten = matched;
      }
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
    roomLitterbox = data.litterbox || 0;
    
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
btnPet.addEventListener("click", () => performCareAction("pet"));
btnTreat.addEventListener("click", () => performCareAction("treat"));
btnClean.addEventListener("click", () => performCareAction("clean"));

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
    roomLitterbox = data.litterbox || 0;
    
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
  y: number;
  targetY: number;
  direction: 'front' | 'back' | 'side';
  isWalking: boolean;
  isFlipped: boolean;
  speed: number;
  speechTimeout: any;
  behavior: 'wandering' | 'napping' | 'grooming' | 'staring' | 'chasing' | 'eating' | 'scratching' | 'playing' | 'bathing';
  behaviorTimer: number; // ticks left for current behavior
  climbPlatform: 'mid' | 'top' | 'none';
}

const playpenStates = new Map<string, PlaypenKittenState>();

const BEHAVIOR_SPEECHES: Record<string, string[]> = {
  napping: [
    "Zzz... 💤",
    "Zzz... purr... 😻",
    "*sleeping in a warm sunbeam*",
    "Purrr... 💤"
  ],
  grooming: [
    "*licks paws*",
    "*cleans face*",
    "Looking neat! ✨"
  ],
  chasing: [
    "A red dot! Chasing! 🔴",
    "Watch me jump! 🧶",
    "Zoomies! 💨"
  ],
  staring: [
    "*stares blankly at you*",
    "Do you have food? 🐟",
    "Pet me? 🥺"
  ],
  wandering: [
    "Exploring the playpen... 🐾",
    "Wandering around...",
    "Looking for toys! 🧸"
  ],
  eating: [
    "Nom nom nom... 🐟",
    "Delicious! 😋",
    "Munch munch munch...",
    "Fish is so good! 🐟"
  ],
  scratching: [
    "*scratch scratch* 💈",
    "Sharpening my claws!",
    "This post feels great!",
    "Must scratch! 🐾"
  ],
  playing: [
    "Batting the yarn! 🧶",
    "Look at it spin!",
    "Yay, yarn! 🧶",
    "Pounce! 🐾"
  ],
  bathing: [
    "Splish splash! 🧼",
    "So bubbly! 🧼",
    "Cleaning time!",
    "Squeaky clean! ✨"
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
    const pers = k.personality || 'shironeko';
    const meta = PERSONALITY_MAP[pers];
    const arch = meta ? meta.archetype : 'lazy';

    if (!state) {
      const initialX = 18 + Math.random() * 64;
      const initialY = 15 + Math.random() * 70;
      let speed = 0.12 + Math.random() * 0.1;
      if (arch === 'lazy') {
        speed = 0.05 + Math.random() * 0.04;
      } else if (arch === 'hyper') {
        speed = 0.24 + Math.random() * 0.12;
      } else if (arch === 'shy') {
        speed = 0.10 + Math.random() * 0.05;
      }

      state = {
        id: k.id,
        x: initialX,
        targetX: initialX,
        y: initialY,
        targetY: initialY,
        direction: 'front',
        isWalking: false,
        isFlipped: Math.random() > 0.5,
        speed: speed,
        speechTimeout: null,
        behavior: 'wandering',
        behaviorTimer: 30 + Math.random() * 40,
        climbPlatform: 'none',
      };
      playpenStates.set(k.id, state);
    }

    const kDiv = document.createElement("div");
    // Class includes behavior, personality, walking, and climbing status
    let climbingClass = "";
    if (state.climbPlatform === 'mid' && Math.abs(state.x - 10) < 5) {
      climbingClass = "climbing-mid";
    } else if (state.climbPlatform === 'top' && Math.abs(state.x - 10) < 5) {
      climbingClass = "climbing-top";
    }
    kDiv.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""} personality-${arch} ${state.isWalking ? 'walking' : ''} ${climbingClass}`;
    kDiv.setAttribute("data-id", k.id);
    
    // Set 3D positions
    const climbOffset = state.climbPlatform === 'mid' ? 30 : (state.climbPlatform === 'top' ? 70 : 0);
    const bottomVal = 12 + (state.y / 100) * 80 + climbOffset;
    const scaleVal = (1.1 - (state.y / 100) * 0.45) * (k.stage === "cat" ? 1.2 : 1.0);
    const zVal = 10 + Math.round(100 - state.y) + (state.climbPlatform !== 'none' ? 20 : 0);
    
    kDiv.style.left = `${state.x}%`;
    kDiv.style.bottom = `${bottomVal}px`;
    kDiv.style.zIndex = `${zVal}`;
    kDiv.style.transform = `translateX(-50%) scale(${scaleVal})`;

    const flipStyle = state.isFlipped ? "transform: scaleX(-1);" : "transform: scaleX(1);";
    
    // Napping override: show sleeping eyes; Grumpy override: show grumpy eyes
    const renderEyes = state.behavior === "napping" ? "sleeping" : (k.eyes === "normal" && arch === "grumpy" ? "grumpy" : k.eyes);

    kDiv.innerHTML = `
      <div class="kitten-speech-bubble hidden">
        <span>Meow!</span>
      </div>
      <div class="kitten-svg-wrapper" style="${flipStyle}">
        ${getKittenSvg(k.color, renderEyes, k.stage === "cat", false, state.direction, state.behavior, state.isWalking, k.accessory)}
      </div>
      <div class="kitten-shadow"></div>
    `;

    // Click handler to select this kitten and pet it directly!
    kDiv.addEventListener("click", (e) => {
      if (isMedicineChaseActive && k.id === chasedKittenId) {
        e.stopPropagation();
        handleMedicineChaseClick();
        return;
      }
      selectedKitten = k;
      renderLitterList();
      updateActivePetDisplay();
      
      // Direct petting care action!
      performCareAction("pet");
      
      e.stopPropagation();
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

    const pers = k.personality || 'shironeko';
    const meta = PERSONALITY_MAP[pers];
    const arch = meta ? meta.archetype : 'lazy';

    // 1. Behavior State Machine Ticker
    state.behaviorTimer--;
    if (state.behaviorTimer <= 0 && (!isMedicineChaseActive || k.id !== chasedKittenId)) {
      // Pick new behavior state
      const roll = Math.random();
      let nextBehavior: 'wandering' | 'napping' | 'grooming' | 'staring' | 'chasing' | 'eating' | 'scratching' | 'playing' | 'bathing';
      state.climbPlatform = 'none'; // Default to floor
      
      // Unlocked Toys Autonomous Behavior overrides
      let chosenToyAction = false;
      if (unlockedToys.includes("cardboard_box") && Math.random() < 0.12) {
        nextBehavior = 'napping';
        state.targetX = 33;
        state.isWalking = true;
        state.behaviorTimer = 50 + Math.floor(Math.random() * 40);
        state.speed = arch === 'lazy' ? 0.06 : 0.14;
        chosenToyAction = true;
      } else if (unlockedToys.includes("catnip_plant") && Math.random() < 0.15) {
        nextBehavior = 'grooming';
        state.targetX = 52;
        state.isWalking = true;
        state.behaviorTimer = 40 + Math.floor(Math.random() * 30);
        state.speed = arch === 'lazy' ? 0.07 : 0.16;
        chosenToyAction = true;
      } else if (unlockedToys.includes("toy_mouse") && Math.random() < 0.18) {
        nextBehavior = 'playing';
        state.targetX = 72;
        state.isWalking = true;
        state.behaviorTimer = 45 + Math.floor(Math.random() * 30);
        state.speed = arch === 'lazy' ? 0.08 : 0.20;
        chosenToyAction = true;
      }

      if (!chosenToyAction) {
        // State-driven hunger/happiness overrides
        if (k.hunger < 50 && Math.random() < 0.75) {
          nextBehavior = 'eating';
          state.targetX = 24; // Walk to Food Bowl (safe 24%)
          state.isWalking = true;
          state.behaviorTimer = 50 + Math.floor(Math.random() * 30);
          state.speed = arch === 'lazy' ? 0.07 : (arch === 'hyper' ? 0.25 : 0.14);
        } else if (k.happiness < 50 && Math.random() < 0.65) {
          if (Math.random() < 0.5) {
            nextBehavior = 'playing';
            state.targetX = 62; // Walk to Yarn Ball
            state.isWalking = true;
            state.behaviorTimer = 50 + Math.floor(Math.random() * 30);
            state.speed = arch === 'lazy' ? 0.07 : (arch === 'hyper' ? 0.25 : 0.14);
          } else {
            nextBehavior = 'scratching';
            state.targetX = 42; // Walk to Scratching Post
            state.isWalking = true;
            state.behaviorTimer = 40 + Math.floor(Math.random() * 25);
            state.speed = arch === 'lazy' ? 0.07 : (arch === 'hyper' ? 0.25 : 0.14);
          }
        } else {
          // Archetype-driven random choices
          if (arch === 'lazy') {
            // Lazy: 55% nap, 20% wander, 15% stare, 5% grooming, 5% play
            if (roll < 0.20) {
              nextBehavior = 'wandering';
              state.behaviorTimer = 30 + Math.floor(Math.random() * 40);
              if (Math.random() < 0.15) {
                state.targetX = 10; // Walk to Cat Tree
                state.climbPlatform = Math.random() > 0.5 ? 'top' : 'mid';
              } else {
                state.targetX = 18 + Math.random() * 64; // Safe bounds
              }
              state.isWalking = true;
              state.speed = 0.05 + Math.random() * 0.04;
            } else if (roll < 0.75) {
              nextBehavior = 'napping';
              state.behaviorTimer = 120 + Math.floor(Math.random() * 120);
              const sleepRoll = Math.random();
              if (sleepRoll < 0.5) {
                state.targetX = 82; // Cozy Bed
              } else if (sleepRoll < 0.75) {
                state.targetX = 10;
                state.climbPlatform = 'mid';
              } else {
                state.targetX = 10;
                state.climbPlatform = 'top';
              }
              state.isWalking = true;
            } else if (roll < 0.90) {
              nextBehavior = 'staring';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 40);
              state.isWalking = false;
            } else if (roll < 0.95) {
              nextBehavior = 'grooming';
              state.behaviorTimer = 35 + Math.floor(Math.random() * 30);
              state.isWalking = false;
            } else {
              nextBehavior = 'playing';
              state.behaviorTimer = 30 + Math.floor(Math.random() * 20);
              state.targetX = 62;
              state.isWalking = true;
            }
          } else if (arch === 'hyper') {
            // Hyper: 35% wander, 10% nap, 10% grooming, 10% staring, 15% play, 10% scratch, 10% chase
            if (roll < 0.35) {
              nextBehavior = 'wandering';
              state.behaviorTimer = 30 + Math.floor(Math.random() * 45);
              if (Math.random() < 0.15) {
                state.targetX = 10;
                state.climbPlatform = Math.random() > 0.5 ? 'top' : 'mid';
              } else {
                state.targetX = 18 + Math.random() * 64;
              }
              state.isWalking = true;
              state.speed = 0.24 + Math.random() * 0.12;
            } else if (roll < 0.45) {
              nextBehavior = 'napping';
              state.behaviorTimer = 35 + Math.floor(Math.random() * 40);
              const sleepRoll = Math.random();
              if (sleepRoll < 0.5) {
                state.targetX = 82;
              } else if (sleepRoll < 0.75) {
                state.targetX = 10;
                state.climbPlatform = 'mid';
              } else {
                state.targetX = 10;
                state.climbPlatform = 'top';
              }
              state.isWalking = true;
            } else if (roll < 0.55) {
              nextBehavior = 'grooming';
              state.behaviorTimer = 30 + Math.floor(Math.random() * 30);
              state.isWalking = false;
            } else if (roll < 0.65) {
              nextBehavior = 'staring';
              state.behaviorTimer = 20 + Math.floor(Math.random() * 20);
              state.isWalking = false;
            } else if (roll < 0.80) {
              nextBehavior = 'playing';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 40);
              state.targetX = 62;
              state.isWalking = true;
              state.speed = 0.30 + Math.random() * 0.10;
            } else if (roll < 0.90) {
              nextBehavior = 'scratching';
              state.behaviorTimer = 35 + Math.floor(Math.random() * 35);
              state.targetX = 42;
              state.isWalking = true;
              state.speed = 0.25 + Math.floor(Math.random() * 10);
            } else {
              nextBehavior = 'chasing';
              state.behaviorTimer = 35 + Math.floor(Math.random() * 40);
              state.targetX = 18 + Math.random() * 64;
              state.isWalking = true;
              state.speed = 0.35 + Math.random() * 0.15;
            }
          } else if (arch === 'shy') {
            // Shy: corner zones mostly
            if (roll < 0.35) {
              nextBehavior = 'wandering';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 50);
              if (Math.random() < 0.2) {
                state.targetX = 10;
                state.climbPlatform = Math.random() > 0.5 ? 'top' : 'mid';
              } else {
                state.targetX = Math.random() > 0.5 ? (18 + Math.random() * 10) : (72 + Math.random() * 10);
              }
              state.isWalking = true;
              state.speed = 0.10 + Math.random() * 0.05;
            } else if (roll < 0.60) {
              nextBehavior = 'napping';
              state.behaviorTimer = 80 + Math.floor(Math.random() * 80);
              const sleepRoll = Math.random();
              if (sleepRoll < 0.5) {
                state.targetX = 82;
              } else if (sleepRoll < 0.75) {
                state.targetX = 10;
                state.climbPlatform = 'mid';
              } else {
                state.targetX = 10;
                state.climbPlatform = 'top';
              }
              state.isWalking = true;
            } else if (roll < 0.80) {
              nextBehavior = 'grooming';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 40);
              state.isWalking = false;
            } else if (roll < 0.95) {
              nextBehavior = 'staring';
              state.behaviorTimer = 30 + Math.floor(Math.random() * 35);
              state.isWalking = false;
            } else {
              nextBehavior = 'playing';
              state.behaviorTimer = 25 + Math.floor(Math.random() * 25);
              state.targetX = 62;
              state.isWalking = true;
            }
          } else {
            // Grumpy: wander, nap, groom, stare, scratch
            if (roll < 0.30) {
              nextBehavior = 'wandering';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 50);
              if (Math.random() < 0.15) {
                state.targetX = 10;
                state.climbPlatform = Math.random() > 0.5 ? 'top' : 'mid';
              } else {
                state.targetX = 18 + Math.random() * 64;
              }
              state.isWalking = true;
              state.speed = 0.12 + Math.random() * 0.06;
            } else if (roll < 0.50) {
              nextBehavior = 'napping';
              state.behaviorTimer = 60 + Math.floor(Math.random() * 80);
              const sleepRoll = Math.random();
              if (sleepRoll < 0.5) {
                state.targetX = 82;
              } else if (sleepRoll < 0.75) {
                state.targetX = 10;
                state.climbPlatform = 'mid';
              } else {
                state.targetX = 10;
                state.climbPlatform = 'top';
              }
              state.isWalking = true;
            } else if (roll < 0.75) {
              nextBehavior = 'grooming';
              state.behaviorTimer = 50 + Math.floor(Math.random() * 50);
              state.isWalking = false;
            } else if (roll < 0.90) {
              nextBehavior = 'staring';
              state.behaviorTimer = 40 + Math.floor(Math.random() * 40);
              state.isWalking = false;
            } else {
              nextBehavior = 'scratching';
              state.behaviorTimer = 35 + Math.floor(Math.random() * 30);
              state.targetX = 42;
              state.isWalking = true;
            }
          }
        }
      }

      state.behavior = nextBehavior;
      
      // Assign targetY based on destination targetX
      if (state.targetX === 24) {
        state.targetY = 45;
      } else if (state.targetX === 33) {
        state.targetY = 55; // Cardboard Box
      } else if (state.targetX === 42) {
        state.targetY = 70;
      } else if (state.targetX === 52) {
        state.targetY = 65; // Catnip Plant
      } else if (state.targetX === 62) {
        state.targetY = 40;
      } else if (state.targetX === 72) {
        state.targetY = 45; // Toy Mouse
      } else if (state.targetX === 82) {
        state.targetY = 50;
      } else if (state.targetX === 10) {
        state.targetY = 85;
      } else if (state.isWalking) {
        state.targetY = 15 + Math.floor(Math.random() * 70);
      }

      // Update direction and flip state based on walking status
      if (!state.isWalking) {
        if (state.behavior === 'eating' || state.behavior === 'scratching' || state.behavior === 'playing') {
          state.direction = 'side';
          if (state.behavior === 'eating') state.isFlipped = state.x < 24;
          else if (state.behavior === 'scratching') state.isFlipped = state.x < 42;
          else if (state.behavior === 'playing') state.isFlipped = state.x < 62;
        } else {
          state.direction = 'front';
        }
      } else {
        const deltaX = state.targetX - state.x;
        const deltaY = state.targetY - state.y;
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          state.direction = deltaY > 0 ? 'back' : 'front';
          state.isFlipped = deltaX < 0;
        } else {
          state.direction = 'side';
          state.isFlipped = deltaX > 0;
        }
      }
      
      // Update DOM classes for CSS animations
      let climbingClass = "";
      if (state.climbPlatform === 'mid' && Math.abs(state.x - 10) < 5) {
        climbingClass = "climbing-mid";
      } else if (state.climbPlatform === 'top' && Math.abs(state.x - 10) < 5) {
        climbingClass = "climbing-top";
      }
      el.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""} personality-${arch} ${state.isWalking ? 'walking' : ''} ${climbingClass}`;
      
      // Re-render SVG to show correct eyes
      const renderEyes = (state.behavior === "napping" || state.behavior === "bathing") ? "sleeping" : (k.eyes === "normal" && arch === "grumpy" ? "grumpy" : k.eyes);
      if (svgWrap) {
        svgWrap.innerHTML = getKittenSvg(k.color, renderEyes, k.stage === "cat", false, state.direction, state.behavior, state.isWalking, k.accessory);
        svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
      }

      // 50% chance to say something about new behavior
      if (Math.random() < 0.5) {
        let pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
        if (Math.random() < 0.4 && meta && meta.speeches) {
          pool = meta.speeches;
        }
        const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
        showKittenSpeech(k.id, randomText);
      }
    }

    // 2. Perform Movement
    if (state.isWalking) {
      const deltaX = state.targetX - state.x;
      const deltaY = state.targetY - state.y;
      
      if (Math.abs(deltaX) < 1.2 && Math.abs(deltaY) < 1.2) {
        // Arrived at target!
        
        // Treat/Zoomies override: if behavior is playing and speed is high, run to another random spot!
        if (state.behavior === "playing" && state.speed > 1.0 && state.behaviorTimer > 10) {
          state.targetX = 18 + Math.random() * 64;
          state.targetY = 15 + Math.random() * 70;
          state.isWalking = true;
          // Set direction based on movement
          const zDeltaX = state.targetX - state.x;
          const zDeltaY = state.targetY - state.y;
          if (Math.abs(zDeltaY) > Math.abs(zDeltaX) * 1.2) {
            state.direction = zDeltaY > 0 ? 'back' : 'front';
            state.isFlipped = zDeltaX < 0;
          } else {
            state.direction = 'side';
            state.isFlipped = zDeltaX > 0;
          }
          if (Math.random() < 0.5) {
            showKittenSpeech(k.id, ["⚡ ZOOMIES! ⚡", "SO MUCH ENERGY! 🍪", "WHEEE! 🏃‍♂️💨"][Math.floor(Math.random() * 3)]);
          }
          return;
        }

        state.isWalking = false;
        state.x = state.targetX;
        state.y = state.targetY;
        el.classList.remove("walking");
        
        // Update direction and flip on arrival
        if (state.behavior === 'eating' || state.behavior === 'scratching' || state.behavior === 'playing') {
          state.direction = 'side';
          if (state.behavior === 'eating') state.isFlipped = state.x < 24;
          else if (state.behavior === 'scratching') state.isFlipped = state.x < 42;
          else if (state.behavior === 'playing') state.isFlipped = state.x < 62;
        } else {
          state.direction = 'front';
        }

        let climbingClass = "";
        if (state.climbPlatform === 'mid' && Math.abs(state.x - 10) < 5) {
          climbingClass = "climbing-mid";
        } else if (state.climbPlatform === 'top' && Math.abs(state.x - 10) < 5) {
          climbingClass = "climbing-top";
        }
        el.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""} personality-${arch} ${climbingClass}`;
        
        // Update inline styles on arrival
        const climbOffset = state.climbPlatform === 'mid' ? 30 : (state.climbPlatform === 'top' ? 70 : 0);
        const bottomVal = 12 + (state.y / 100) * 80 + climbOffset;
        const scaleVal = (1.1 - (state.y / 100) * 0.45) * (k.stage === "cat" ? 1.2 : 1.0);
        const zVal = 10 + Math.round(100 - state.y) + (state.climbPlatform !== 'none' ? 20 : 0);
        
        el.style.left = `${state.x}%`;
        el.style.bottom = `${bottomVal}px`;
        el.style.zIndex = `${zVal}`;
        el.style.transform = `translateX(-50%) scale(${scaleVal})`;
        
        // Re-render SVG to show correct eyes on arrival
        const renderEyes = (state.behavior === "napping" || state.behavior === "bathing") ? "sleeping" : (k.eyes === "normal" && arch === "grumpy" ? "grumpy" : k.eyes);
        if (svgWrap) {
          svgWrap.innerHTML = getKittenSvg(k.color, renderEyes, k.stage === "cat", false, state.direction, state.behavior, state.isWalking, k.accessory);
          svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
        }

        // Custom Toys Arrival Side-effects
        if (state.targetX === 52) {
          triggerParticles("⭐");
          showKittenSpeech(k.id, "🌿 CATNIP HIGH! ⭐");
        } else if (state.targetX === 33) {
          showKittenSpeech(k.id, "📦 Cozy box time!");
        } else if (state.targetX === 72) {
          showKittenSpeech(k.id, "🐭 Pounce on the mouse!");
        }

        // 20% chance to speak on arrival
        if (Math.random() < 0.2) {
          let pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
          if (meta && meta.speeches && Math.random() < 0.5) {
            pool = meta.speeches;
          }
          const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
          showKittenSpeech(k.id, randomText);
        }
      } else {
        // Walk!
        state.x += Math.sign(deltaX) * Math.min(Math.abs(deltaX), state.speed);
        state.y += Math.sign(deltaY) * Math.min(Math.abs(deltaY), state.speed * 0.85);
        
        // Calculate dynamic direction while walking
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          state.direction = deltaY > 0 ? 'back' : 'front';
          state.isFlipped = deltaX < 0;
        } else {
          state.direction = 'side';
          state.isFlipped = deltaX > 0;
        }
        
        let climbingClass = "";
        if (state.climbPlatform === 'mid' && Math.abs(state.x - 10) < 5) {
          climbingClass = "climbing-mid";
        } else if (state.climbPlatform === 'top' && Math.abs(state.x - 10) < 5) {
          climbingClass = "climbing-top";
        }
        el.className = `playpen-kitten ${state.behavior} ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""} personality-${arch} walking ${climbingClass}`;
        
        // Update inline styles while walking
        const climbOffset = state.climbPlatform === 'mid' ? 30 : (state.climbPlatform === 'top' ? 70 : 0);
        const bottomVal = 12 + (state.y / 100) * 80 + climbOffset;
        const scaleVal = (1.1 - (state.y / 100) * 0.45) * (k.stage === "cat" ? 1.2 : 1.0);
        const zVal = 10 + Math.round(100 - state.y) + (state.climbPlatform !== 'none' ? 20 : 0);
        
        el.style.left = `${state.x}%`;
        el.style.bottom = `${bottomVal}px`;
        el.style.zIndex = `${zVal}`;
        el.style.transform = `translateX(-50%) scale(${scaleVal})`;
        
        if (svgWrap) {
          svgWrap.innerHTML = getKittenSvg(k.color, (state.behavior === "napping" || state.behavior === "bathing" ? "sleeping" : (k.eyes === "normal" && arch === "grumpy" ? "grumpy" : k.eyes)), k.stage === "cat", false, state.direction, state.behavior, state.isWalking, k.accessory);
          svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
        }
      }
    } else {
      // Sitting still
      // Medicine Chase Mode: if cursor gets close to the chased sick kitten, make it run away!
      if (isMedicineChaseActive && k.id === chasedKittenId) {
        const dist = Math.abs(state.x - mouseXPercent);
        if (dist < 12) {
          state.isWalking = true;
          state.speed = 1.25;
          // Set target to opposite side
          state.targetX = mouseXPercent < state.x ? Math.min(82, state.x + 35 + Math.random() * 15) : Math.max(18, state.x - 35 - Math.random() * 15);
          state.targetY = 15 + Math.random() * 70;
          state.behaviorTimer = 100;
          
          // Update direction
          const deltaX = state.targetX - state.x;
          const deltaY = state.targetY - state.y;
          if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
            state.direction = deltaY > 0 ? 'back' : 'front';
            state.isFlipped = deltaX < 0;
          } else {
            state.direction = 'side';
            state.isFlipped = deltaX > 0;
          }
          
          el.className = `playpen-kitten chasing walking selected personality-${arch}`;
          
          if (Math.random() < 0.5) {
            showKittenSpeech(k.id, ["Catch me if you can! 🏃‍♂️", "No medicine! 🙀", "Aaaah! 🙀"][Math.floor(Math.random() * 3)]);
          }
        }
      } else {
        // 0.4% chance to meow/speak while sitting
        if (Math.random() < 0.004) {
          let pool = BEHAVIOR_SPEECHES[state.behavior] || ["Meow!"];
          if (meta && meta.speeches && Math.random() < 0.6) {
            pool = meta.speeches;
          }
          const randomText = pool[Math.floor(Math.random() * pool.length)] || "Meow!";
          showKittenSpeech(k.id, randomText);
        }
      }
      
      // Ensure positioning remains stable when sitting still
      const climbOffset = state.climbPlatform === 'mid' ? 30 : (state.climbPlatform === 'top' ? 70 : 0);
      const bottomVal = 12 + (state.y / 100) * 80 + climbOffset;
      const scaleVal = (1.1 - (state.y / 100) * 0.45) * (k.stage === "cat" ? 1.2 : 1.0);
      const zVal = 10 + Math.round(100 - state.y) + (state.climbPlatform !== 'none' ? 20 : 0);
      
      el.style.left = `${state.x}%`;
      el.style.bottom = `${bottomVal}px`;
      el.style.zIndex = `${zVal}`;
      el.style.transform = `translateX(-50%) scale(${scaleVal})`;
      
      if (svgWrap) {
        svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
      }
    }
  });

  // 3. Update active states on playroom interactive objects
  const treeEl = document.getElementById("scene-cat-tree");
  const bowlEl = document.getElementById("scene-food-bowl");
  const postEl = document.getElementById("scene-scratching-post");
  const yarnEl = document.getElementById("scene-yarn-ball");
  const bedEl = document.getElementById("scene-cat-bed");
  const boxEl = document.getElementById("scene-cardboard-box");
  const plantEl = document.getElementById("scene-catnip-plant");
  const mouseEl = document.getElementById("scene-toy-mouse");

  let anyoneClimbing = false;
  let anyoneEating = false;
  let anyoneScratching = false;
  let anyonePlaying = false;
  let anyoneNapping = false;
  let anyoneInBox = false;
  let anyoneAtCatnip = false;
  let anyoneAtMouse = false;

  playpenStates.forEach((state) => {
    if (!state.isWalking) {
      if (state.climbPlatform !== "none" && Math.abs(state.x - 10) < 5) anyoneClimbing = true;
      if (state.behavior === "eating" && Math.abs(state.x - 24) < 2.5) anyoneEating = true;
      if (state.behavior === "scratching" && Math.abs(state.x - 42) < 2.5) anyoneScratching = true;
      if (state.behavior === "playing" && Math.abs(state.x - 62) < 2.5) anyonePlaying = true;
      if (state.behavior === "napping" && Math.abs(state.x - 82) < 2.5) anyoneNapping = true;
      if (state.targetX === 33 && Math.abs(state.x - 33) < 2.5) anyoneInBox = true;
      if (state.targetX === 52 && Math.abs(state.x - 52) < 2.5) anyoneAtCatnip = true;
      if (state.targetX === 72 && Math.abs(state.x - 72) < 2.5) anyoneAtMouse = true;
    }
  });

  if (treeEl) {
    if (anyoneClimbing) treeEl.classList.add("active");
    else treeEl.classList.remove("active");
  }
  if (bowlEl) {
    if (anyoneEating) {
      bowlEl.classList.add("active");
      bowlEl.classList.remove("bowl-empty");
    } else {
      bowlEl.classList.remove("active");
      bowlEl.classList.add("bowl-empty");
    }
  }
  if (postEl) {
    if (anyoneScratching) postEl.classList.add("active");
    else postEl.classList.remove("active");
  }
  if (yarnEl) {
    if (anyonePlaying) yarnEl.classList.add("active");
    else yarnEl.classList.remove("active");
  }
  if (bedEl) {
    if (anyoneNapping) bedEl.classList.add("active");
    else bedEl.classList.remove("active");
  }
  if (boxEl) {
    if (anyoneInBox) boxEl.classList.add("active");
    else boxEl.classList.remove("active");
  }
  if (plantEl) {
    if (anyoneAtCatnip) plantEl.classList.add("active");
    else plantEl.classList.remove("active");
  }
  if (mouseEl) {
    if (anyoneAtMouse) mouseEl.classList.add("active");
    else mouseEl.classList.remove("active");
  }
}, 100);

// Playpen Laser Pointer Click Listener
playpenViewport.addEventListener("click", (e) => {
  // If clicked on any button, card, modal, or kitten itself, ignore it to prevent conflict
  const target = e.target as HTMLElement;
  if (target.closest(".playpen-kitten, .pet-stats-card, .balloon, .care-controls, button, input")) {
    return;
  }

  // Get coordinate relative to playpen-viewport
  const rect = playpenViewport.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const pctX = (clickX / rect.width) * 100;
  const clickYFromBottom = rect.height - clickY;
  const pctY = Math.max(15, Math.min(85, (clickYFromBottom / 120) * 100));

  // Create laser dot element
  const laser = document.createElement("div");
  laser.className = "laser-dot";
  laser.style.left = `${clickX}px`;
  laser.style.top = `${clickY}px`;
  playpenViewport.appendChild(laser);

  // Remove after animation finishes
  setTimeout(() => {
    laser.remove();
  }, 1500);

  // Alert all kittens in the playpen to chase the laser!
  kittensList.forEach((k) => {
    const state = playpenStates.get(k.id);
    if (!state) return;

    // Do not chase laser if in medicine chase mode
    if (isMedicineChaseActive && k.id === chasedKittenId) return;

    const pers = k.personality || 'shironeko';
    const meta = PERSONALITY_MAP[pers];
    const arch = meta ? meta.archetype : 'lazy';

    // Laser chase behavior:
    state.behavior = 'chasing';
    state.targetX = Math.max(18, Math.min(82, pctX));
    state.targetY = pctY;
    state.climbPlatform = 'none';
    state.isWalking = true;
    
    // Set custom chase speed based on personality archetype
    if (arch === 'lazy') {
      state.speed = 0.22 + Math.random() * 0.08;
    } else if (arch === 'hyper') {
      state.speed = 0.70 + Math.random() * 0.20;
    } else if (arch === 'shy') {
      state.speed = 0.35 + Math.random() * 0.10;
    } else {
      state.speed = 0.45 + Math.random() * 0.15;
    }

    // Set behavior timer to something longer so they chase and stay excited
    state.behaviorTimer = 35 + Math.floor(Math.random() * 30); // 3.5 - 6.5s

    // Update DOM class to apply running animations
    const el = document.querySelector(`.playpen-kitten[data-id="${k.id}"]`) as HTMLDivElement;
    if (el) {
      // Calculate dynamic direction while chasing laser
      const deltaX = state.targetX - state.x;
      const deltaY = state.targetY - state.y;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        state.direction = deltaY > 0 ? 'back' : 'front';
        state.isFlipped = deltaX < 0;
      } else {
        state.direction = 'side';
        state.isFlipped = deltaX > 0;
      }
      
      el.className = `playpen-kitten chasing walking ${selectedKitten && selectedKitten.id === k.id ? "selected" : ""} personality-${arch}`;
      
      const svgWrap = el.querySelector(".kitten-svg-wrapper") as HTMLDivElement;
      if (svgWrap) {
        svgWrap.innerHTML = getKittenSvg(k.color, k.eyes, k.stage === "cat", false, state.direction, state.behavior, state.isWalking, k.accessory);
        svgWrap.style.transform = state.isFlipped ? "scaleX(-1)" : "scaleX(1)";
      }
    }

    // Laser chase dialogue meows!
    const chaseSpeech = [
      "🔴 Red dot!",
      "I see the dot! 🐾",
      "Get the red dot! 💨",
      "Pounce! 🔴",
      "Chasing! Zoom!",
      "Got it! No, wait...",
    ];
    // 80% chance to meow when laser is clicked
    if (Math.random() < 0.8) {
      const randomText = chaseSpeech[Math.floor(Math.random() * chaseSpeech.length)];
      showKittenSpeech(k.id, randomText);
    }
  });
});

// Mini-game: Litterbox Scooping
function startLitterboxGame() {
  const modal = document.getElementById("litterbox-modal") as HTMLDivElement;
  const tray = document.getElementById("litterbox-area") as HTMLDivElement;
  const counter = document.getElementById("litterbox-count") as HTMLSpanElement;
  
  if (!modal || !tray || !counter) return;
  
  tray.innerHTML = "";
  modal.classList.remove("hidden");
  
  let poopsRemaining = 5;
  counter.textContent = poopsRemaining.toString();
  
  for (let i = 0; i < 5; i++) {
    const poop = document.createElement("div");
    poop.className = "poop-item";
    poop.textContent = "💩";
    poop.style.left = `${10 + Math.random() * 75}%`;
    poop.style.top = `${10 + Math.random() * 65}%`;
    
    poop.addEventListener("click", () => {
      poop.remove();
      poopsRemaining--;
      counter.textContent = poopsRemaining.toString();
      
      // Clean particle
      triggerParticles("🧼");
      
      if (poopsRemaining === 0) {
        modal.classList.add("hidden");
        sendCareActionToServer("clean");
      }
    });
    
    tray.appendChild(poop);
  }
}

// Mini-game: Medicine Chase
function startMedicineChase(kittenId: string) {
  if (!selectedKitten) return;
  isMedicineChaseActive = true;
  medicineClicks = 0;
  chasedKittenId = kittenId;
  
  // Disable buttons & update styling
  updateActivePetDisplay();
  
  const existingHud = document.getElementById("medicine-chase-hud");
  if (existingHud) existingHud.remove();
  
  const chaseHud = document.createElement("div");
  chaseHud.className = "medicine-chase-hud";
  chaseHud.id = "medicine-chase-hud";
  chaseHud.innerHTML = `💊 CHASE! Click ${selectedKitten.name} <span id="chase-clicks-left">3</span> more times!`;
  playpenViewport.appendChild(chaseHud);
  
  const state = playpenStates.get(kittenId);
  if (state) {
    state.behavior = 'chasing';
    state.isWalking = true;
    state.targetX = state.x < 50 ? 82 : 18;
    state.targetY = 15 + Math.random() * 70;
    state.speed = 1.2;
    state.behaviorTimer = 100;
    
    // Update direction
    const deltaX = state.targetX - state.x;
    const deltaY = state.targetY - state.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      state.direction = deltaY > 0 ? 'back' : 'front';
      state.isFlipped = deltaX < 0;
    } else {
      state.direction = 'side';
      state.isFlipped = deltaX > 0;
    }
    
    showKittenSpeech(kittenId, "Oh no, medicine! 🙀 *runs*");
    
    const el = document.querySelector(`.playpen-kitten[data-id="${kittenId}"]`) as HTMLDivElement;
    if (el) {
      el.className = `playpen-kitten chasing walking selected personality-${PERSONALITY_MAP[selectedKitten.personality || 'shironeko'].archetype}`;
    }
  }
}

function handleMedicineChaseClick() {
  if (!isMedicineChaseActive || !selectedKitten) return;
  
  medicineClicks++;
  triggerParticles("💊");
  
  const counterSpan = document.getElementById("chase-clicks-left");
  if (counterSpan) {
    counterSpan.textContent = (3 - medicineClicks).toString();
  }
  
  const state = playpenStates.get(chasedKittenId);
  if (state) {
    if (medicineClicks < 3) {
      showKittenSpeech(chasedKittenId, ["Yikes! 🙀", "Can't catch me!", "No medicine!"][medicineClicks - 1]);
      state.targetX = state.x < 50 ? (65 + Math.random() * 15) : (18 + Math.random() * 15);
      state.targetY = 15 + Math.random() * 70;
      state.isWalking = true;
      state.speed = 1.3;
      state.behaviorTimer = 100;
      
      // Update direction
      const deltaX = state.targetX - state.x;
      const deltaY = state.targetY - state.y;
      if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
        state.direction = deltaY > 0 ? 'back' : 'front';
        state.isFlipped = deltaX < 0;
      } else {
        state.direction = 'side';
        state.isFlipped = deltaX > 0;
      }
    } else {
      isMedicineChaseActive = false;
      const hud = document.getElementById("medicine-chase-hud");
      if (hud) hud.remove();
      
      showKittenSpeech(chasedKittenId, "You got me! Cured! 💖");
      sendCareActionToServer("medicine");
    }
  }
}

// Track cursor horizontal percent relative to playpen viewport
playpenViewport.addEventListener("mousemove", (e) => {
  const rect = playpenViewport.getBoundingClientRect();
  mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
});

// Cancel Litterbox Game Handler
const btnLitterboxCancel = document.getElementById("btn-litterbox-cancel") as HTMLButtonElement;
if (btnLitterboxCancel) {
  btnLitterboxCancel.addEventListener("click", () => {
    const modal = document.getElementById("litterbox-modal") as HTMLDivElement;
    if (modal) modal.classList.add("hidden");
  });
}

// Sanctuary Caretaker Shop Client Logic
function renderShop() {
  if (!shopItemsGrid) return;
  shopItemsGrid.innerHTML = "";

  if (activeShopTab === "accessories") {
    SHOP_ACCESSORIES.forEach((item) => {
      const card = document.createElement("div");
      const isUnlocked = unlockedAccessories.includes(item.id);
      const isEquipped = selectedKitten && selectedKitten.accessory === item.id;
      
      card.className = `shop-item-card ${isUnlocked ? "unlocked" : ""} ${isEquipped ? "equipped" : ""}`;
      
      let buttonHtml = "";
      if (isEquipped) {
        buttonHtml = `<button class="shop-btn equip-btn active-equip">Unequip</button>`;
      } else if (isUnlocked) {
        buttonHtml = `<button class="shop-btn equip-btn">Equip</button>`;
      } else {
        buttonHtml = `<button class="shop-btn buy-btn">Buy 🪙${item.cost}</button>`;
      }
      
      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-details">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
        </div>
        <div class="shop-item-action-area">
          ${buttonHtml}
        </div>
      `;
      
      const actionBtn = card.querySelector(".shop-btn");
      if (actionBtn) {
        actionBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleShopItemAction(item.id, "accessories");
        });
      }
      
      shopItemsGrid.appendChild(card);
    });
  } else {
    SHOP_TOYS.forEach((item) => {
      const card = document.createElement("div");
      const isUnlocked = unlockedToys.includes(item.id);
      
      card.className = `shop-item-card ${isUnlocked ? "unlocked" : ""}`;
      
      let buttonHtml = "";
      if (isUnlocked) {
        buttonHtml = `<span class="shop-placed-label">Placed 🧸</span>`;
      } else {
        buttonHtml = `<button class="shop-btn buy-btn">Buy 🪙${item.cost}</button>`;
      }
      
      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-details">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.description}</div>
        </div>
        <div class="shop-item-action-area">
          ${buttonHtml}
        </div>
      `;
      
      if (!isUnlocked) {
        const actionBtn = card.querySelector(".shop-btn");
        if (actionBtn) {
          actionBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleShopItemAction(item.id, "toys");
          });
        }
      }
      
      shopItemsGrid.appendChild(card);
    });
  }
}

async function handleShopItemAction(itemId: string, type: "accessories" | "toys") {
  if (type === "accessories") {
    const isUnlocked = unlockedAccessories.includes(itemId);
    if (!isUnlocked) {
      const item = SHOP_ACCESSORIES.find(x => x.id === itemId);
      if (!item) return;
      if (playerCoins < item.cost) {
        alert("Not enough Paw Coins! Take care of kittens to earn more.");
        return;
      }
      await performShopCareAction("buy_accessory", itemId);
    } else {
      if (!selectedKitten) {
        alert("Please select a kitten from the playpen first!");
        return;
      }
      const isEquipped = selectedKitten.accessory === itemId;
      if (isEquipped) {
        await performShopCareAction("unequip_accessory", itemId);
      } else {
        await performShopCareAction("equip_accessory", itemId);
      }
    }
  } else {
    const item = SHOP_TOYS.find(x => x.id === itemId);
    if (!item) return;
    if (playerCoins < item.cost) {
      alert("Not enough Paw Coins! Take care of kittens to earn more.");
      return;
    }
    await performShopCareAction("buy_toy", itemId);
  }
}

async function performShopCareAction(actionType: CareActionType, targetId: string) {
  let emoji = "🪙";
  if (actionType === "equip_accessory") emoji = "🎩";
  if (actionType === "unequip_accessory") emoji = "👒";
  if (actionType === "buy_toy") emoji = "🧸";
  
  triggerParticles(emoji);

  try {
    const reqBody: ActionRequest = {
      kittenId: selectedKitten ? selectedKitten.id : "global",
      action: actionType,
      targetId: targetId
    };
    
    const res = await fetch(ApiEndpoint.Action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) throw new Error("Shop Action failed");
    
    const data: ActionResponse = await res.json();
    kittensList = data.kittens;
    catsList = data.cats;
    roomLitterbox = data.litterbox || 0;
    
    if (selectedKitten) {
      const matched = kittensList.find(x => x.id === selectedKitten!.id) || catsList.find(x => x.id === selectedKitten!.id);
      if (matched) {
        selectedKitten = matched;
      }
    }

    renderLitterList();
    renderSanctuaryGallery();
    renderLogs(data.logs);
    renderLeaderboard(data.leaderboard);
    renderPlaypen();
    updateActivePetDisplay();
    
    playerCoins = data.profile.pawCoins ?? 100;
    unlockedAccessories = data.profile.unlockedAccessories ?? [];
    unlockedToys = data.profile.unlockedToys ?? [];
    if (hudCoinsTop) hudCoinsTop.textContent = playerCoins.toString();
    if (hudCoins) hudCoins.textContent = playerCoins.toString();
    hudActions.textContent = data.profile.actionsPerformed.toString();

    renderShop();
    updateToysVisibility();
  } catch (err) {
    console.error("Shop Action error:", err);
  }
}

function updateToysVisibility() {
  const boxEl = document.getElementById("scene-cardboard-box");
  const plantEl = document.getElementById("scene-catnip-plant");
  const mouseEl = document.getElementById("scene-toy-mouse");
  
  if (boxEl) {
    boxEl.classList.toggle("hidden", !unlockedToys.includes("cardboard_box"));
  }
  if (plantEl) {
    plantEl.classList.toggle("hidden", !unlockedToys.includes("catnip_plant"));
  }
  if (mouseEl) {
    mouseEl.classList.toggle("hidden", !unlockedToys.includes("toy_mouse"));
  }
}

// Shop Tab Listeners
if (shopTabAccessories && shopTabToys) {
  shopTabAccessories.addEventListener("click", () => {
    activeShopTab = "accessories";
    shopTabAccessories.classList.add("active");
    shopTabToys.classList.remove("active");
    renderShop();
  });

  shopTabToys.addEventListener("click", () => {
    activeShopTab = "toys";
    shopTabToys.classList.add("active");
    shopTabAccessories.classList.remove("active");
    renderShop();
  });
}

// Initial Load & Polling Ticker
fetchInit();
setInterval(fetchInit, 20000); // Poll server every 20 seconds
