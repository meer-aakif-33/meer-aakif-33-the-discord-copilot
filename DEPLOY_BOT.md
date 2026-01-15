# Deploying Discord Copilot to Railway

Railway is a great choice because it's easy to set up and works well for "always-on" bots.

## Prerequisites
- A GitHub account (to push your code).
- A Railway account (can sign up with GitHub).

## Step 1: Push Your Code to GitHub
If you haven't already, push your project to a GitHub repository.
1. Create a new repository on GitHub (e.g., `discord-copilot`).
2. Run these commands in your VS Code terminal (root folder):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Discord Copilot"
   git branch -M main
   # Replace with YOUR repo URL
   git remote add origin https://github.com/YOUR_USERNAME/discord-copilot.git
   git push -u origin main
   ```

## Step 2: Create a Project on Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard).
2. Click **"New Project"**.
3. Select **"Deploy from GitHub repo"**.
4. Select your `discord-copilot` repository.
5. Click **"Deploy Now"**.

## Step 3: Configure Service (IMPORTANT)
Railway will try to detect both the Admin Console and the Bot. We want to configure the **Bot** specifically here.

1. You will likely see two services or a "Root Directory" option.
2. Click on the service card for the repo.
3. Go to **Settings** -> **Root Directory**.
   - Change it to: `/discord-bot`
   - This tells Railway to look inside the bot folder for `package.json`.

## Step 4: Add Environment Variables
The bot needs your secrets to work.
1. Go to the **Variables** tab in your Railway service.
2. Add the following keys (copy them from your local `.env` file):
   - `DISCORD_TOKEN`
   - `OPENAI_API_KEY` (or `GEMINI_API_KEY` depending on what you used)
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (if used)

## Step 5: Verify Deployment
1. Go to the **Deployments** tab.
2. You should see a "Building" or "Active" deployment.
3. Click on "View Logs".
4. You should see:
   ```
   ✅ Logged in as Discord Copilot#...
   🚀 Discord Copilot is ready!
   ```

## Step 6: Create Discord Invite Link
To let people add your bot to their servers:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on your Application.
3. Go to **OAuth2** -> **URL Generator**.
4. Check **Scopes**:
   - `bot`
   - `applications.commands` (optional)
5. Check **Bot Permissions**:
   - `Read Messages/View Channels`
   - `Send Messages`
   - `Embed Links`
   - `Attach Files`
   - `Read Message History`
6. Copy the **Generated URL** at the bottom.
7. Open that URL in your browser to invite the bot to your server.

**Done! Your bot is now in the cloud ☁️**
