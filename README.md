# Ask Your Data — Claude + Metabase

A simple chat app that lets your team ask questions about your data in plain English.

## Setup

1. Fork or clone this repo
2. In Vercel, import this repo as a new project
3. Add these environment variables in Vercel:
   - `ANTHROPIC_API_KEY` — from console.anthropic.com
   - `METABASE_URL` — your Metabase URL e.g. https://yourcompany.metabaseapp.com
   - `METABASE_API_KEY` — from Metabase Account Settings → API Keys
4. Deploy!

## Usage

- Select your database (BigQuery or ClickHouse) from the dropdown
- Type any question about your data
- Claude will generate SQL, run it, and explain the results
