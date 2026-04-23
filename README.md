## Simplify Admin Dashboard MVP

Admin dashboard MVP built with Next.js and Mantine. Includes mock login, role-based access, and access control management for demo/testing flows.

## Local Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Readiness Checks

Before deploying, run:

```bash
npm run lint
npm run build
```

Both must pass locally.

## Deploy to Vercel

### 1) Create and push a GitHub repo

```bash
git init
git add .
git commit -m "Initial admin dashboard MVP"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2) Import the repo in Vercel

- Go to [https://vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Framework preset: `Next.js` (auto-detected)
- Build command: `next build` (default)
- Output setting: leave default
- Deploy

### 3) Environment variables

This MVP currently uses mock/local data and does not require mandatory env vars.
If you later add API keys or backend URLs, define them in:

- Vercel Project Settings -> Environment Variables
- Local `.env.local` (already ignored by `.gitignore`)

### 4) Continuous deployment

After initial setup:

- every push to `main` triggers production deployment
- pull requests can be configured for preview deployments

## Notes

- Project is configured with `turbopack.root` in `next.config.mjs` to avoid root-detection warnings in nested workspace setups.
