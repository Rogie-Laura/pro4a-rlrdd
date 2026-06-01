# PRO4A RLRDD — Property Management Information System

Separate Next.js app for **RLRDD** (Regional Logistics Research & Development Division).  
Uses the **same Supabase database** as [pro4a-rprmd](../pro4a-rprmd) with its own session column and RPCs.

## Quick start

1. Copy env from RPRMD (already done if cloned locally):

   ```bash
   cp ../pro4a-rprmd/.env.local .env.local
   ```

2. Run SQL in Supabase SQL Editor:

   ```
   sql/001_rlrdd_auth.sql
   ```

3. Install and run (port **3001** so RPRMD can stay on 3000):

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3001/login

## Login access

| Role | Can sign in |
|------|-------------|
| `super_admin` | Yes (shared bootstrap account) |
| `rlrdd_admin` | Yes |
| `rlrdd_officer` | Yes |
| `rlrdd_staff` | Yes |
| RPRMD-only roles | No |

Bootstrap: badge `226609`, password `111111` (if `super_admin` in DB).

## vs RPRMD

| | RPRMD | RLRDD |
|--|--------|--------|
| Folder | `pro4a-rprmd` | `pro4a-rlrdd` |
| Port (dev) | 3000 | 3001 |
| Session cookie | `pro4a_session` | `pro4a_rlrdd_session` |
| DB session column | `session` | `rlrdd_session` |
| Login RPC | `login_user` | `rlrdd_login_user` |

Both apps can be logged in at the same time in one browser.

## Deploy

Create a new Vercel project pointing at this repo/folder with the same Supabase env vars as RPRMD.
