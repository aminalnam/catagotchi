export enum ApiEndpoint {
  Init = "/api/init",
  Action = "/api/action",
  TimeWarp = "/api/time-warp",
  Rename = "/api/rename",
  SpawnStray = "/api/spawn-stray",
  OnPostCreate = "/internal/menu/post-create",
  OnAppInstall = "/internal/on-app-install",
}

export type KittenStage = "kitten" | "cat";

export interface Kitten {
  id: string;
  name: string;
  stage: KittenStage;
  color: string;      // Visual color hex or css class
  eyes: string;       // Eye style (normal, happy, sleeping, sad)
  bornAt: number;     // Birth timestamp
  hunger: number;     // 0 - 100
  happiness: number;  // 0 - 100
  cleanliness: number;// 0 - 100
  neglectedSince: number | null; // Timestamp when stats fell to 0
  originSubreddit: string;
  ownerUser: string;  // User who played for the first time and generated this kitten
  personality: KittenPersonality;
  isSick?: boolean;
}

export type KittenPersonality =
  | "smudge"
  | "venus"
  | "colonel_meow"
  | "nala"
  | "shironeko"
  | "tama"
  | "choupette"
  | "stubbs"
  | "socks"
  | "towser"
  | "sylvester"
  | "simons_cat"
  | "thomas_omalley"
  | "marie"
  | "crookshanks"
  | "jiji"
  | "luna"
  | "jonesy"
  | "mrs_norris";

export interface PersonalityMetadata {
  displayName: string;
  subtitle: string;
  archetype: "lazy" | "hyper" | "grumpy" | "shy";
  decayMultipliers: {
    hunger: number;
    happiness: number;
    cleanliness: number;
  };
  speeches: string[];
}

export const PERSONALITY_MAP: Record<KittenPersonality, PersonalityMetadata> = {
  smudge: {
    displayName: "Smudge",
    subtitle: "Defensive, unapologetic, and highly confused.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.0, happiness: 1.2, cleanliness: 1.0 },
    speeches: [
      "Who is yelling at me? 😾",
      "I just wanted my salad... 🥗",
      "Confused screeching!",
      "Stop with the dramatic yelling!",
      "No drama, only salad. 🥬"
    ]
  },
  venus: {
    displayName: "Venus",
    subtitle: "Mysterious, striking, and gentle split-face cat.",
    archetype: "shy",
    decayMultipliers: { hunger: 1.0, happiness: 0.8, cleanliness: 1.0 },
    speeches: [
      "Split-face beauty ✨",
      "I'm very sweet! 😻",
      "Mysterious but friendly...",
      "Gentle purrs...",
      "Double the cuteness!"
    ]
  },
  colonel_meow: {
    displayName: "Colonel Meow",
    subtitle: "Dictatorial, intensely fluffy, and imposing.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.2, happiness: 1.3, cleanliness: 1.4 },
    speeches: [
      "Bow before your overlord! 👑",
      "Fluffiness is supreme.",
      "Pour me a scotch, hooman. 🥃",
      "Seeking world domination! 😈",
      "Frowns majestically."
    ]
  },
  nala: {
    displayName: "Nala Cat",
    subtitle: "Expressive, perpetually startled, and sweet.",
    archetype: "hyper",
    decayMultipliers: { hunger: 1.1, happiness: 1.0, cleanliness: 1.0 },
    speeches: [
      "Oh! What's that? 🙀",
      "Startled blue eyes! 👁️👁️",
      "Wait, did you hear that? 😸",
      "Innocent surprise!",
      "Play with me! 🧶"
    ]
  },
  shironeko: {
    displayName: "Shironeko",
    subtitle: "Zen, deeply relaxed, and sleepy basket cat.",
    archetype: "lazy",
    decayMultipliers: { hunger: 0.7, happiness: 0.7, cleanliness: 0.7 },
    speeches: [
      "Deep zen meditation... 💤",
      "Flowers on my head... 🌸",
      "Balance is key.",
      "Super relaxed... 🧘",
      "Is that a cabbage? 🥬"
    ]
  },
  tama: {
    displayName: "Tama",
    subtitle: "Dutiful, welcoming, and patient stationmaster.",
    archetype: "lazy",
    decayMultipliers: { hunger: 0.9, happiness: 0.8, cleanliness: 1.0 },
    speeches: [
      "Welcome to Kishi Station! 🎫",
      "Ticket check, please! 🚉",
      "Wearing my stationmaster cap. 🎓",
      "Greeting passengers dutifully.",
      "Safe travels! 🐾"
    ]
  },
  choupette: {
    displayName: "Choupette",
    subtitle: "Pampered, elite, and demanding luxury cat.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.3, happiness: 1.2, cleanliness: 0.8 },
    speeches: [
      "Only Goyard silver dishes. 🍽️",
      "Where are my maids? 💅",
      "High-society luxury only.",
      "Karl's favorite elite. 💎",
      "Do not touch my fur. 💅"
    ]
  },
  stubbs: {
    displayName: "Stubbs",
    subtitle: "Bureaucratic, community-oriented honorary mayor.",
    archetype: "lazy",
    decayMultipliers: { hunger: 1.0, happiness: 0.7, cleanliness: 1.1 },
    speeches: [
      "Mayor Stubbs presiding. 🏛️",
      "Serve me my catnip water! 🍷",
      "Meeting at the general store.",
      "Running this town is tiring. 💤",
      "Veto this vet visit!"
    ]
  },
  socks: {
    displayName: "Socks",
    subtitle: "Diplomatic, photogenic, and fiercely territorial.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.0, happiness: 1.1, cleanliness: 1.0 },
    speeches: [
      "I rule the White House! 🇺🇸",
      "Keep that Labrador Buddy away! 🐶",
      "Diplomatic state dinner meows.",
      "Fiercely territorial.",
      "Press conference time!"
    ]
  },
  towser: {
    displayName: "Towser",
    subtitle: "Lethal, focused, and record-holding mouser.",
    archetype: "hyper",
    decayMultipliers: { hunger: 1.4, happiness: 0.8, cleanliness: 1.2 },
    speeches: [
      "Caught another mouse! 🐭",
      "Glenturret Distillery guardian.",
      "Record holder: 30k mice! 🏆",
      "Lethal hunting focus.",
      "Did something move? 💨"
    ]
  },
  sylvester: {
    displayName: "Sylvester",
    subtitle: "Persistent, lisping, and perpetually defeated.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.3, happiness: 1.2, cleanliness: 1.0 },
    speeches: [
      "Sufferin' succotash! 💦",
      "I will catch that Tweety bird! 🐤",
      "Stubborn pride.",
      "Defeated again! Hmph.",
      "Just wait till next time!"
    ]
  },
  simons_cat: {
    displayName: "Simon's Cat",
    subtitle: "Demanding, destructive, and eternally hungry.",
    archetype: "hyper",
    decayMultipliers: { hunger: 1.5, happiness: 1.1, cleanliness: 1.3 },
    speeches: [
      "*points at mouth* 🍽️",
      "*scratches the couch* 🛋️",
      "Wake up! *sits on face*",
      "Where is the food? 🐟",
      "Destructive zoomies! 💥"
    ]
  },
  thomas_omalley: {
    displayName: "Thomas O'Malley",
    subtitle: "Street-smart, smooth-talking, and worldly.",
    archetype: "hyper",
    decayMultipliers: { hunger: 1.0, happiness: 0.9, cleanliness: 1.2 },
    speeches: [
      "Abraham de Lacy Giuseppe Casey... 🎶",
      "Street-smart alley swagger.",
      "Duchess is a real lady. 🎀",
      "Heart of gold.",
      "I know all the best spots."
    ]
  },
  marie: {
    displayName: "Marie",
    subtitle: "Sassy, romantic, and opinionated lady.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.0, happiness: 1.2, cleanliness: 0.7 },
    speeches: [
      "Because I'm a lady, that's why! 🎀",
      "Sassy attitude.",
      "Proper and opinionated.",
      "Ladies do not start fights...",
      "But I can finish them!"
    ]
  },
  crookshanks: {
    displayName: "Crookshanks",
    subtitle: "Highly intelligent, suspicious, and loyal familiar.",
    archetype: "shy",
    decayMultipliers: { hunger: 1.0, happiness: 0.8, cleanliness: 1.0 },
    speeches: [
      "I know that rat is a wizard! 🐀",
      "Highly suspicious squinting.",
      "Fiercely loyal to Hermione.",
      "Magic-sensing purrs.",
      "Hunting in the common room."
    ]
  },
  jiji: {
    displayName: "Jiji",
    subtitle: "Cautious, sarcastic, and supportive companion.",
    archetype: "shy",
    decayMultipliers: { hunger: 1.0, happiness: 0.9, cleanliness: 1.0 },
    speeches: [
      "Kiki, this plan is way too risky! 🧹",
      "Sarcastic comments...",
      "Voice of absolute reason.",
      "Worried familiar meows.",
      "Are we moving again?"
    ]
  },
  luna: {
    displayName: "Luna",
    subtitle: "Wise, responsible, and slightly nagging mentor.",
    archetype: "shy",
    decayMultipliers: { hunger: 1.0, happiness: 1.0, cleanliness: 1.0 },
    speeches: [
      "Usagi, focus on saving the world! 🌙",
      "Nagging mentor lectures...",
      "Crescent moon marking.",
      "Wise guidance.",
      "Please don't sleep in class!"
    ]
  },
  jonesy: {
    displayName: "Jonesy",
    subtitle: "Aloof, unflappable, and a true spaceship survivor.",
    archetype: "lazy",
    decayMultipliers: { hunger: 1.0, happiness: 0.6, cleanliness: 1.0 },
    speeches: [
      "A xenomorph? Indifferent yawn. 🥱",
      "Staying in the hyper-sleep pod.",
      "Standard cat indifference.",
      "True survivor of Nostromo.",
      "Meow... where is Ripley? 🚀"
    ]
  },
  mrs_norris: {
    displayName: "Mrs. Norris",
    subtitle: "Observant, tattletale, and deeply loyal watcher.",
    archetype: "grumpy",
    decayMultipliers: { hunger: 1.0, happiness: 1.1, cleanliness: 1.0 },
    speeches: [
      "Filch! Someone is out of bed! 🔦",
      "Tattletale staring.",
      "Guarding the corridors.",
      "Observant glowing eyes.",
      "I see you wandering! 😾"
    ]
  }
};


export interface GameLog {
  id: string;
  text: string;
  timestamp: number;
}

export interface PlayerProfile {
  username: string;
  actionsPerformed: number;
  hasPlayedBefore: boolean;
}

export interface LeaderboardItem {
  username: string;
  score: number;
}

export interface InitResponse {
  type: "init";
  postId: string;
  username: string;
  subredditName: string;
  isModerator: boolean;
  kittens: Kitten[];
  cats: Kitten[];
  logs: GameLog[];
  profile: PlayerProfile;
  leaderboard: LeaderboardItem[];
  litterbox?: number;
}

export type CareActionType = "feed" | "play" | "clean" | "pet" | "medicine" | "treat";

export interface ActionRequest {
  kittenId: string;
  action: CareActionType;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  kittens: Kitten[];
  cats: Kitten[];
  logs: GameLog[];
  profile: PlayerProfile;
  leaderboard: LeaderboardItem[];
  litterbox?: number;
}

export interface RenameRequest {
  kittenId: string;
  newName: string;
}

export interface RenameResponse {
  success: boolean;
  message: string;
  kittens: Kitten[];
}

export interface TimeWarpRequest {
  hours: number;
}

export interface TimeWarpResponse {
  success: boolean;
  message: string;
  kittens: Kitten[];
  cats: Kitten[];
  logs: GameLog[];
}
