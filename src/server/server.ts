import type { IncomingMessage, ServerResponse } from "node:http";
import { context, reddit, redis } from "@devvit/web/server";
import type { PartialJsonValue, TriggerResponse, UiResponse } from "@devvit/web/shared";
import { once } from "node:events";
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
} from "../shared/api.ts";

// Configurable constants
const DECAY_HUNGER_PER_HOUR = 4;
const DECAY_HAPPINESS_PER_HOUR = 3;
const DECAY_CLEANLINESS_PER_HOUR = 2;
const NEGLECT_RUNAWAY_LIMIT_HOURS = 12;
const KITTEN_TO_CAT_GROWTH_HOURS = 72; // 3 days

const KITTEN_NAMES = [
  "Snoo", "Mittens", "Luna", "Garfield", "Felix", "Oliver", "Leo", "Milo",
  "Simba", "Bella", "Coco", "Loki", "Chloe", "Nala", "Cleo", "Ziggy",
  "Jasper", "Cookie", "Peanut", "Whiskers", "Paws", "Buster", "Daisy"
];

const KITTEN_COLORS = [
  "#FF9AA2", // Pastel Pink
  "#FFB7B2", // Pastel Coral
  "#FFDAC1", // Pastel Orange-Yellow
  "#E2F0CB", // Pastel Lime Green
  "#B5EAD7", // Pastel Teal
  "#C7CEEA", // Pastel Blue-Purple
  "#FFC6FF", // Pastel Magenta
  "#E8AEFF", // Pastel Lilac
  "#D8F3DC", // Pastel Mint
  "#FEEAFA"  // Pastel Cream
];

export async function serverOnRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  try {
    await onRequest(req, rsp);
  } catch (err) {
    const msg = `server error; ${err instanceof Error ? err.stack : err}`;
    console.error(msg);
    writeJSON(500, { error: msg, status: 500 }, rsp);
  }
}

async function onRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  const url = req.url;

  if (!url || url === "/") {
    writeJSON(404, { error: "not found", status: 404 }, rsp);
    return;
  }

  const parsedUrl = new URL(url, "http://localhost");
  const endpoint = parsedUrl.pathname as ApiEndpoint;

  let body: any;
  switch (endpoint) {
    case ApiEndpoint.Init:
      body = await onInit();
      break;
    case ApiEndpoint.Action:
      body = await onAction(req);
      break;
    case ApiEndpoint.Rename:
      body = await onRename(req);
      break;
    case ApiEndpoint.SpawnStray:
      body = await onSpawnStray();
      break;
    case ApiEndpoint.TimeWarp:
      body = await onTimeWarp(req);
      break;
    case ApiEndpoint.OnPostCreate:
      body = await onMenuNewPost();
      break;
    case ApiEndpoint.OnAppInstall:
      body = await onAppInstall();
      break;
    default:
      body = { error: "not found", status: 404 };
      break;
  }

  writeJSON("status" in body ? body.status : 200, body, rsp);
}

// Help Utilities
function getPostId(): string {
  if (!context.postId) {
    throw Error("no post ID");
  }
  return context.postId;
}

function getUsername(): string {
  return context.username || "Anonymous";
}

function getSubredditName(): string {
  return context.subredditName || "test_subreddit";
}

// State Accessors
async function getKittens(subredditName: string): Promise<Kitten[]> {
  const raw = await redis.get(`catagotchi:kittens:${subredditName}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveKittens(subredditName: string, kittens: Kitten[]): Promise<void> {
  await redis.set(`catagotchi:kittens:${subredditName}`, JSON.stringify(kittens));
}

async function getCats(subredditName: string): Promise<Kitten[]> {
  const raw = await redis.get(`catagotchi:cats:${subredditName}`);
  return raw ? JSON.parse(raw) : [];
}

async function saveCats(subredditName: string, cats: Kitten[]): Promise<void> {
  await redis.set(`catagotchi:cats:${subredditName}`, JSON.stringify(cats));
}

async function getLastUpdate(subredditName: string): Promise<number> {
  const raw = await redis.get(`catagotchi:last_update:${subredditName}`);
  return raw ? parseInt(raw, 10) : Date.now();
}

async function saveLastUpdate(subredditName: string, time: number): Promise<void> {
  await redis.set(`catagotchi:last_update:${subredditName}`, time.toString());
}

async function getLogs(subredditName: string): Promise<GameLog[]> {
  const raw = await redis.get(`catagotchi:logs:${subredditName}`);
  return raw ? JSON.parse(raw) : [];
}

async function addLog(subredditName: string, text: string): Promise<GameLog[]> {
  const logs = await getLogs(subredditName);
  const newLog: GameLog = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    text,
    timestamp: Date.now(),
  };
  logs.unshift(newLog);
  // Keep last 40 logs
  const sliced = logs.slice(0, 40);
  await redis.set(`catagotchi:logs:${subredditName}`, JSON.stringify(sliced));
  return sliced;
}

async function getProfile(username: string): Promise<PlayerProfile> {
  const raw = await redis.get(`catagotchi:profile:${username}`);
  if (raw) {
    return JSON.parse(raw);
  }
  return {
    username,
    actionsPerformed: 0,
    hasPlayedBefore: false,
  };
}

async function saveProfile(username: string, profile: PlayerProfile): Promise<void> {
  await redis.set(`catagotchi:profile:${username}`, JSON.stringify(profile));
}

async function getLeaderboard(subredditName: string): Promise<{ username: string, score: number }[]> {
  const raw = await redis.get(`catagotchi:leaderboard:${subredditName}`);
  return raw ? JSON.parse(raw) : [];
}

async function updateLeaderboard(username: string, score: number, subredditName: string): Promise<{ username: string, score: number }[]> {
  const raw = await redis.get(`catagotchi:leaderboard:${subredditName}`);
  let leaderboard: { username: string, score: number }[] = raw ? JSON.parse(raw) : [];
  
  const idx = leaderboard.findIndex((x) => x.username === username);
  if (idx !== -1) {
    leaderboard[idx].score = score;
  } else {
    leaderboard.push({ username, score });
  }
  
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  
  await redis.set(`catagotchi:leaderboard:${subredditName}`, JSON.stringify(leaderboard));
  return leaderboard;
}

async function checkIsModerator(username: string, subredditName: string): Promise<boolean> {
  try {
    const moderators = await reddit.getModerators({
      subredditName,
      username,
    }).all();
    return moderators.length > 0;
  } catch (err) {
    console.error(`Error checking moderator status for ${username}:`, err);
    return false;
  }
}

// Game Core Logic
function generateKitten(ownerUser: string, originSub: string): Kitten {
  const name = KITTEN_NAMES[Math.floor(Math.random() * KITTEN_NAMES.length)] || "Snoo";
  const color = KITTEN_COLORS[Math.floor(Math.random() * KITTEN_COLORS.length)] || "#B5EAD7";
  const personalities = Object.keys(PERSONALITY_MAP) as KittenPersonality[];
  const personality = personalities[Math.floor(Math.random() * personalities.length)] || "shironeko";
  
  return {
    id: `k-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    stage: "kitten",
    color,
    eyes: "normal",
    bornAt: Date.now(),
    hunger: 70,
    happiness: 70,
    cleanliness: 70,
    neglectedSince: null,
    originSubreddit: originSub,
    ownerUser,
    personality,
  };
}

// Handle time progression: decay stats and process runaways
async function progressTime(subredditName: string, hoursElapsed: number): Promise<{
  decayedKittens: Kitten[];
  runawaysCount: number;
}> {
  if (hoursElapsed <= 0) {
    const kittens = await getKittens(subredditName);
    return { decayedKittens: kittens, runawaysCount: 0 };
  }

  const kittens = await getKittens(subredditName);
  const activeKittens: Kitten[] = [];
  let runawaysCount = 0;

  for (const k of kittens) {
    // Determine personality-specific decay multipliers
    let hungerMult = 1.0;
    let happinessMult = 1.0;
    let cleanlinessMult = 1.0;
    
    const p = k.personality || "shironeko";
    const meta = PERSONALITY_MAP[p];
    if (meta) {
      hungerMult = meta.decayMultipliers.hunger;
      happinessMult = meta.decayMultipliers.happiness;
      cleanlinessMult = meta.decayMultipliers.cleanliness;
    }

    // 1. Decay Stats
    k.hunger = Math.max(0, k.hunger - DECAY_HUNGER_PER_HOUR * hoursElapsed * hungerMult);
    k.happiness = Math.max(0, k.happiness - DECAY_HAPPINESS_PER_HOUR * hoursElapsed * happinessMult);
    k.cleanliness = Math.max(0, k.cleanliness - DECAY_CLEANLINESS_PER_HOUR * hoursElapsed * cleanlinessMult);

    // 2. Update expression based on stats
    if (k.hunger < 20 || k.happiness < 20) {
      k.eyes = "sad";
    } else if (k.happiness > 80) {
      k.eyes = "happy";
    } else {
      k.eyes = "normal";
    }

    // 3. Check Neglect
    const isNeglectedNow = k.hunger <= 0 && k.happiness <= 0;
    if (isNeglectedNow) {
      if (k.neglectedSince === null) {
        k.neglectedSince = Date.now();
      }
      
      const neglectedHours = (Date.now() - k.neglectedSince) / (1000 * 60 * 60);
      if (neglectedHours >= NEGLECT_RUNAWAY_LIMIT_HOURS) {
        // KITTEN RUNS AWAY!
        runawaysCount++;
        await handleRunaway(k, subredditName);
        continue; // Do not add back to active kittens
      }
    } else {
      k.neglectedSince = null;
    }

    activeKittens.push(k);
  }

  await saveKittens(subredditName, activeKittens);
  return { decayedKittens: activeKittens, runawaysCount };
}

// Handle runaway posting to CatagotchiApp or mock shelter
async function handleRunaway(kitten: Kitten, originSub: string): Promise<void> {
  const runawayKitten = {
    ...kitten,
    neglectedSince: null,
    hunger: 40,
    happiness: 40,
    cleanliness: 40,
    eyes: "sad" as const,
  };

  await addLog(originSub, `😿 Kitten ${kitten.name} ran away because of neglect!`);

  try {
    // Attempt standard Reddit post on coordinator subreddit
    await reddit.submitPost({
      title: `[RUNAWAY] Kitten ${runawayKitten.name} fled from r/${originSub}!`,
      subredditName: "CatagotchiApp",
      text: `KITTEN_DATA:${JSON.stringify(runawayKitten)}`,
    });
  } catch (err) {
    // Fallback: Local sandbox shelter in Redis
    console.log(`Failed to post to r/CatagotchiApp (probably playtesting). Saving to local sandbox shelter.`);
    const rawShelter = await redis.get(`catagotchi:mock_shelter`);
    const shelter: Kitten[] = rawShelter ? JSON.parse(rawShelter) : [];
    shelter.push(runawayKitten);
    await redis.set(`catagotchi:mock_shelter`, JSON.stringify(shelter));
  }
}

// Check if we can adopt runaways from the pool
async function tryAdoptRunaway(subredditName: string): Promise<boolean> {
  const currentKittens = await getKittens(subredditName);
  if (currentKittens.length >= 6) {
    return false; // Subreddit litter has enough kittens
  }

  // 1. Try local mock shelter fallback first
  const rawShelter = await redis.get(`catagotchi:mock_shelter`);
  const shelter: Kitten[] = rawShelter ? JSON.parse(rawShelter) : [];
  
  if (shelter.length > 0) {
    const adopted = shelter.shift()!;
    await redis.set(`catagotchi:mock_shelter`, JSON.stringify(shelter));
    
    currentKittens.push(adopted);
    await saveKittens(subredditName, currentKittens);
    await addLog(subredditName, `🏠 A runaway kitten named ${adopted.name} wandered into our subreddit looking for a home!`);
    return true;
  }

  // 2. Try Reddit posts from r/CatagotchiApp
  try {
    const newPosts = await reddit.getNewSubmissions({
      subredditName: "CatagotchiApp",
      limit: 25,
    }).all();

    for (const post of newPosts) {
      if (post.title.startsWith("[RUNAWAY]") && post.text && post.text.includes("KITTEN_DATA:")) {
        // Check comments to see if claimed
        const comments = await reddit.getComments({ postId: post.id }).all();
        const alreadyClaimed = comments.some(c => c.body && c.body.startsWith("[CLAIMED]"));
        
        if (!alreadyClaimed) {
          // Attempt to claim
          await reddit.submitComment({
            postId: post.id,
            body: `[CLAIMED] by r/${subredditName}`,
          });

          // Extract data
          const dataIndex = post.text.indexOf("KITTEN_DATA:");
          const jsonStr = post.text.substring(dataIndex + "KITTEN_DATA:".length);
          const adopted: Kitten = JSON.parse(jsonStr);
          
          currentKittens.push(adopted);
          await saveKittens(subredditName, currentKittens);
          await addLog(subredditName, `🏠 A runaway kitten named ${adopted.name} from r/${adopted.originSubreddit} was adopted by our subreddit!`);
          return true;
        }
      }
    }
  } catch (err) {
    // Suppress warning if coordinator subreddit not accessible
    console.log(`Failed to fetch from r/CatagotchiApp.`);
  }

  return false;
}

// 1. App Init
async function onInit(): Promise<InitResponse> {
  const postId = getPostId();
  const username = getUsername();
  const subredditName = getSubredditName();

  const isModerator = await checkIsModerator(username, subredditName);
  let profile = await getProfile(username);
  
  // 1. Process elapsed time and decay
  const lastUpdate = await getLastUpdate(subredditName);
  const now = Date.now();
  const hoursElapsed = (now - lastUpdate) / (1000 * 60 * 60);

  if (hoursElapsed > 0.05) { // Update if more than 3 minutes elapsed
    await progressTime(subredditName, hoursElapsed);
    await saveLastUpdate(subredditName, now);
  }

  let kittens = await getKittens(subredditName);
  let cats = await getCats(subredditName);

  // 2. First Play logic: spawn kitten if user is new
  if (!profile.hasPlayedBefore) {
    profile.hasPlayedBefore = true;
    await saveProfile(username, profile);

    const newKitten = generateKitten(username, subredditName);
    kittens.push(newKitten);
    await saveKittens(subredditName, kittens);
    await addLog(subredditName, `🎉 u/${username} joined the game! A new kitten named ${newKitten.name} has crawled into our subreddit.`);
  }

  // 3. Adopt runaways if we are below capacity
  const adopted = await tryAdoptRunaway(subredditName);
  if (adopted) {
    kittens = await getKittens(subredditName);
  }

  // 4. Auto-Spawn stray if litter is still completely empty
  if (kittens.length === 0) {
    const stray = generateKitten("Stray", subredditName);
    kittens.push(stray);
    await saveKittens(subredditName, kittens);
    await addLog(subredditName, `🐱 A new stray kitten named ${stray.name} wandered into the empty litter!`);
  }

  const logs = await getLogs(subredditName);
  const leaderboard = await getLeaderboard(subredditName);

  return {
    type: "init",
    postId,
    username,
    subredditName,
    isModerator,
    kittens,
    cats,
    logs,
    profile,
    leaderboard,
  };
}

// 2. Pet, Feed, Clean, Play Action
async function onAction(req: IncomingMessage): Promise<ActionResponse> {
  const { kittenId, action } = await readJSON<ActionRequest>(req);
  const username = getUsername();
  const subredditName = getSubredditName();

  let kittens = await getKittens(subredditName);
  let cats = await getCats(subredditName);
  let profile = await getProfile(username);

  const kitten = kittens.find((k) => k.id === kittenId);
  if (!kitten) {
    return {
      success: false,
      message: "Kitten not found in litter.",
      kittens,
      cats,
      logs: await getLogs(subredditName),
      profile,
      leaderboard: await getLeaderboard(subredditName),
    };
  }

  let message = "";
  switch (action) {
    case "feed":
      if (kitten.hunger >= 100) {
        message = `${kitten.name} is already full!`;
      } else {
        kitten.hunger = Math.min(100, kitten.hunger + 25);
        kitten.eyes = "happy";
        message = `You fed ${kitten.name}! (+25 Hunger)`;
      }
      break;
    case "play":
      if (kitten.happiness >= 100) {
        message = `${kitten.name} is already super happy!`;
      } else {
        kitten.happiness = Math.min(100, kitten.happiness + 20);
        kitten.cleanliness = Math.max(0, kitten.cleanliness - 10);
        kitten.eyes = "happy";
        message = `You played with ${kitten.name}! (+20 Happiness, -10 Cleanliness)`;
      }
      break;
    case "clean":
      if (kitten.cleanliness >= 100) {
        message = `${kitten.name} is already squeaky clean!`;
      } else {
        kitten.cleanliness = Math.min(100, kitten.cleanliness + 30);
        kitten.eyes = "normal";
        message = `You cleaned ${kitten.name}! (+30 Cleanliness)`;
      }
      break;
    case "pet":
      kitten.happiness = Math.min(100, kitten.happiness + 15);
      kitten.eyes = "happy";
      message = `You petted ${kitten.name}! (+15 Happiness)`;
      break;
  }

  // Update profile
  profile.actionsPerformed += 1;
  await saveProfile(username, profile);

  // Check growth into cat
  const kittenAgeHours = (Date.now() - kitten.bornAt) / (1000 * 60 * 60);
  const isHealthy = kitten.hunger >= 60 && kitten.happiness >= 60 && kitten.cleanliness >= 60;
  
  if (kittenAgeHours >= KITTEN_TO_CAT_GROWTH_HOURS && isHealthy) {
    kitten.stage = "cat";
    kitten.eyes = "happy";
    // Remove from kittens, add to cats
    kittens = kittens.filter((k) => k.id !== kittenId);
    cats.push(kitten);
    await saveCats(subredditName, cats);
    
    await addLog(subredditName, `🏆 AMAZING! ${kitten.name} has grown up into a beautiful cat and moved to the Cat Sanctuary!`);
    message = `🏆 AMAZING! ${kitten.name} has grown up into a mature cat!`;
  } else {
    await addLog(subredditName, `❤️ u/${username} performed ${action} on ${kitten.name}`);
  }

  await saveKittens(subredditName, kittens);
  const logs = await getLogs(subredditName);
  const leaderboard = await updateLeaderboard(username, profile.actionsPerformed, subredditName);

  return {
    success: true,
    message,
    kittens,
    cats,
    logs,
    profile,
    leaderboard,
  };
}

// 3. Rename Kitten
async function onRename(req: IncomingMessage): Promise<RenameResponse> {
  const { kittenId, newName } = await readJSON<RenameRequest>(req);
  const username = getUsername();
  const subredditName = getSubredditName();

  const kittens = await getKittens(subredditName);
  const kitten = kittens.find((k) => k.id === kittenId);
  
  if (!kitten) {
    return { success: false, message: "Kitten not found.", kittens };
  }

  const isMod = await checkIsModerator(username, subredditName);
  const isOwner = kitten.ownerUser === username;

  if (!isMod && !isOwner) {
    return { success: false, message: "Only the adopter or a moderator can rename this kitten.", kittens };
  }

  const cleanName = newName.trim().substring(0, 15);
  if (cleanName.length === 0) {
    return { success: false, message: "Invalid name.", kittens };
  }

  const oldName = kitten.name;
  kitten.name = cleanName;
  await saveKittens(subredditName, kittens);
  await addLog(subredditName, `✏️ u/${username} renamed ${oldName} to ${cleanName}`);

  return { success: true, message: `Renamed to ${cleanName}`, kittens };
}

async function onSpawnStray(): Promise<any> {
  const username = getUsername();
  const subredditName = getSubredditName();

  const kittens = await getKittens(subredditName);
  
  if (kittens.length >= 8) {
    return { success: false, message: "Litter is full! We cannot fit any more stray kittens.", kittens };
  }

  const stray = generateKitten("Stray", subredditName);
  kittens.push(stray);
  await saveKittens(subredditName, kittens);
  await addLog(subredditName, `🐱 A stray kitten named ${stray.name} wandered into our sanctuary, summoned by u/${username}!`);

  const cats = await getCats(subredditName);
  const logs = await getLogs(subredditName);
  const profile = await getProfile(username);

  return {
    success: true,
    message: `A stray kitten named ${stray.name} joined the litter!`,
    kittens,
    cats,
    logs,
    profile
  };
}

// 4. Time Warp Admin testing tool
async function onTimeWarp(req: IncomingMessage): Promise<TimeWarpResponse> {
  const { hours } = await readJSON<TimeWarpRequest>(req);
  const username = getUsername();
  const subredditName = getSubredditName();

  const isMod = await checkIsModerator(username, subredditName);
  if (!isMod) {
    const kittens = await getKittens(subredditName);
    const cats = await getCats(subredditName);
    const logs = await getLogs(subredditName);
    return { success: false, message: "Only moderators can time warp.", kittens, cats, logs };
  }

  // 1. Advance the kitten birthdates to simulate age progression
  const kittens = await getKittens(subredditName);
  const offsetMs = hours * 60 * 60 * 1000;
  
  for (const k of kittens) {
    k.bornAt -= offsetMs;
  }
  await saveKittens(subredditName, kittens);

  // 2. Perform the stat decay
  const { decayedKittens } = await progressTime(subredditName, hours);
  
  // 3. Check if they can grow up now
  let finalKittens = decayedKittens;
  let cats = await getCats(subredditName);

  const healthyKittensForCat = [...finalKittens];
  for (const k of healthyKittensForCat) {
    const kittenAgeHours = (Date.now() - k.bornAt) / (1000 * 60 * 60);
    const isHealthy = k.hunger >= 60 && k.happiness >= 60 && k.cleanliness >= 60;
    
    if (kittenAgeHours >= KITTEN_TO_CAT_GROWTH_HOURS && isHealthy) {
      k.stage = "cat";
      k.eyes = "happy";
      finalKittens = finalKittens.filter((x) => x.id !== k.id);
      cats.push(k);
      await addLog(subredditName, `🏆 [Time Warp] ${k.name} has grown up into a beautiful cat!`);
    }
  }

  await saveKittens(subredditName, finalKittens);
  await saveCats(subredditName, cats);
  
  await addLog(subredditName, `⏰ Admin u/${username} warped time forward by ${hours} hours!`);
  const logs = await getLogs(subredditName);

  return {
    success: true,
    message: `Warped forward by ${hours} hours successfully!`,
    kittens: finalKittens,
    cats,
    logs,
  };
}

// 5. Custom Post Management
async function onMenuNewPost(): Promise<UiResponse> {
  const subredditName = getSubredditName();
  if (!context.subredditName) {
    throw new Error("subredditName is required to create a custom post");
  }
  const post = await reddit.submitCustomPost({
    title: "Kittehgotchi Kitten Sanctuary",
    subredditName: context.subredditName,
    entry: "default",
  });
  return {
    showToast: { text: `Kittehgotchi Post ${post.id} created.`, appearance: "success" },
    navigateTo: post.url,
  };
}

async function onAppInstall(): Promise<TriggerResponse> {
  if (!context.subredditName) {
    throw new Error("subredditName is required to create a custom post");
  }
  await reddit.submitCustomPost({
    title: "Kittehgotchi Kitten Sanctuary",
    subredditName: context.subredditName,
    entry: "default",
  });
  return {};
}

function writeJSON<T extends PartialJsonValue>(
  status: number,
  json: Readonly<T>,
  rsp: ServerResponse,
): void {
  const body = JSON.stringify(json);
  const len = Buffer.byteLength(body);
  rsp.writeHead(status, {
    "Content-Length": len,
    "Content-Type": "application/json",
  });
  rsp.end(body);
}

async function readJSON<T>(req: IncomingMessage): Promise<T> {
  const chunks: Uint8Array[] = [];
  req.on("data", (chunk) => chunks.push(chunk));
  await once(req, "end");
  return JSON.parse(`${Buffer.concat(chunks)}`);
}
