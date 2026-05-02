# KindPoints

KindPoints is a mobile-first Family Reward Points app for parents to track positive behaviours, corrections, repair actions, rewards, and a shared family teamwork goal. It uses Next.js App Router, TypeScript, Tailwind CSS, and `localStorage` for MVP persistence.

## Features

- Add, edit, and delete child profiles with emoji avatars.
- Record positive, negative, repair, and custom reusable behaviours.
- Fairness safeguards: per-incident cap, daily correction cap, no below-zero balance by default, 3:1 positive recognition nudges, and repair suggestions.
- Reward shop with custom rewards and point deduction on redemption.
- Child profile pages with badges, progress, reward availability, timeline, and areas to improve.
- Parent settings for fairness rules, dark mode, simple PIN field, JSON export, reset, and clear-all data.
- Family teamwork goal, daily kindness challenge, simple add-point animation, and PWA manifest/service worker assets.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Deploy To Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Import the repository in Vercel.
3. Keep the default Next.js settings.
4. Deploy.

No database or environment variables are required for the MVP because all data is stored in the browser with `localStorage`.

## Project Structure

```text
src/app              App Router pages and global layout
src/components       Reusable UI and modal components
src/lib              Data types, defaults, storage provider, and utilities
public               PWA manifest, icon, and service worker
```
