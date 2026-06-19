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
}

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
}

export type CareActionType = "feed" | "play" | "clean" | "pet";

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
