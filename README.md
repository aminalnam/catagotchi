# Kittehgotchi 🐱

An interactive, community-driven virtual pet (Tamagotchi) application built natively for Reddit using the **Devvit SDK**. 

Subreddit communities adopt and collectively care for a litter of kittens. If neglected, the kittens will run away to seek shelter in other subreddits running the app. If nurtured successfully, they mature into cats and move to the subreddit's permanent **Cat Sanctuary**.

---

## 🎮 Gameplay & Rules

1. **Collective Caretaking**: Any member of the subreddit can feed, play with, clean, or pet any kitten in the active litter. Every care action boosts the kitten's stats and is logged in the public activity feed.
2. **Stat Decay & Neglect**: Kittens have three core stats (Hunger, Happiness, Cleanliness) that decay over time:
   - **Hunger**: Decays by 4% per hour.
   - **Happiness**: Decays by 3% per hour.
   - **Cleanliness**: Decays by 2% per hour.
3. **Runaway Mechanism**: If a kitten's Hunger and Happiness hit 0% for more than 12 hours, they **run away**. The app automatically posts their data to the central coordinator subreddit (`r/CatagotchiApp`) where another subreddit running the app can adopt them.
4. **Local Sandbox Shelter**: If the coordinator subreddit is unreachable (e.g. during local playtesting), runaway kittens wander into a local fallback Redis shelter, where they can be adopted by the next empty litter.
5. **Growth & Maturation**: A kitten matures into a permanent **Sanctuary Cat** after **72 hours** of age, provided all its stats are healthy (60% or higher). Mature cats do not decay or require care actions, and are memorialized in the sanctuary gallery.
6. **First-Time Spawning**: When a new caretaker joins the game for the first time, a unique kitten is spawned under their ownership. If the litter is ever completely empty (due to runaways or maturity), a new stray kitten is auto-spawned to keep the sanctuary active.

---

## 🛠️ Architecture & Tech Stack

The application is structured into a client-server web app model running on Reddit's **Devvit Custom Post Web Views** environment:

- **Frontend Viewport**: Natively styled using Vanilla CSS with high-performance glassmorphism, floating particle animations, speech bubbles, and custom-drawn SVGs.
- **Dynamic SVGs**: Custom rendering system representing the iconic "Reddit Cat" face, including Snoo-like white circular eyes, cheek fur spikes, top hair tufts, and a pink tongue blep. Built as a single closed path to prevent overlapping borders.
- **Backend API Server**: Handles state management sandboxed in Reddit's Redis database. Exposes REST-like endpoints to the client.
- **Distributed Coordination**: Utilizes post listings and comment claims on `r/CatagotchiApp` as a decentralized, Reddit-native lock registry to securely transfer runaway kittens across subreddits.

---

## 📂 Project Structure

```text
catagotchi/
├── devvit.json          # Devvit app configuration and permissions
├── package.json         # Scripts, dependencies, and Devvit SDK configs
├── tsconfig.json        # TypeScript compile configurations
├── tools/
│   └── build.ts         # esbuild compilation script for bundling client and server
├── public/              # WebView static assets
│   ├── index.html       # Viewport HTML layout
│   ├── index.css        # Premium styling, glassmorphism, animations
│   └── index.js         # Compiled Client JS (built via esbuild)
└── src/
    ├── shared/
    │   └── api.ts       # Shared TypeScript types, state interfaces, and API endpoints
    ├── client/
    │   └── index.ts     # Client UI events, autonomous actions, and SVG rendering
    └── server/
        ├── index.ts     # Devvit HTTP server wrapper and router
        └── server.ts    # Main game engine, time progression decay, and Redis storage
```

---

## 🚀 Installation & Local Development

### Prerequisites

- **Node.js**: Version `22.6.0` or higher.
- **Devvit CLI**: Installed globally (`npm install -g @devvit/cli`).
- **Reddit Account**: A moderator account with a playground subreddit for testing.

### Setup

1. Clone this repository.
2. Install the node modules:
   ```bash
   npm install
   ```
3. Set your GitHub token for authentication:
   ```powershell
   $env:GITHUB_TOKEN = "your_github_token"
   ```

### Running the App

1. **Build the Source**:
   Run the esbuild builder tool to compile TypeScript files and static assets:
   ```bash
   npm run build
   ```
2. **Start Playtest Server**:
   To playtest on your test subreddit, use the Devvit CLI:
   ```bash
   npm run dev
   ```
   *Note: If port `5678` is already in use by another local project, you can override the dev server port:*
   ```powershell
   $env:PORT=5679; npx devvit playtest
   ```
3. **Admin Time Warp**:
   Moderators can instantly advance the litter's time by 1, 12, or 72 hours using the moderator panel at the bottom of the viewport to test decay, runaways, and maturation.

---

## 🛡️ Guidelines & Conventions

- **Visual Quality**: Never use placeholders for visuals. SVGs must be hand-crafted and styled to represent high-quality vector designs.
- **Reddit Sandbox Constraints**: All state must reside in Reddit Redis. Do not rely on external database services.
- **Viewport Constraints**: Ensure all controls, HUD elements, and lists fit within standard Reddit WebView iframe heights (~500px) without generating double vertical scrollbars.
