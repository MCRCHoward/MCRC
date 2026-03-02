# Calendly Integration Setup Guide

This guide explains how to set up and configure Calendly OAuth integration for the MCRC application.

## Prerequisites

1. A Calendly account (free or paid)
2. Access to Calendly Developer Settings
3. Firebase Admin credentials configured

## Step 1: Create Calendly OAuth Application

1. Log in to your Calendly account
2. Navigate to **Settings** → **Integrations** → **API & Webhooks**
my https://calendly.com/integrations/api_webhooks
<div class="pg5yfws"><div class="caa1ekh"><div class="b15h8fme f21vzet f1yzffax g1f5dsur d1dzuwnm"><p class="c18pvg3k cg4c1by c7jd249" style="color: currentcolor;">Revoke or generate tokens below. You can generate up to 10 tokens.</p><div class="b15h8fme c1gpq36o v8v5m7x d1dzuwnm"><div class="cr1mn3z">Please be aware that personal access tokens you create as an admin will grant access to Calendly data for everyone in your organization.</div></div></div><div class="b15h8fme f21vzet f1yzffax g1drhciy d1dzuwnm"><div><button class="uvkj3lh b15h8fme bzua8jl dyxacjh soq3ksa c1meqzve c4izad" type="button"><span class="t1850o97 t7sc041">Generate New Token</span></button><span class="tn1yp3f">1/10 tokens</span></div></div><table class="atm_w5_1osqo2v atm_3g_1ktdpln atm_5w_idpfg4 atm_4b_us1cs3 atm_5k_1y44olf atm_2d_lzjfed atm_71_p8gy7z"><thead><tr class="t19sd0rs"><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Name</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Created on</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Last Accessed</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Action</div></th></tr></thead><tbody><tr class="r15404cu"><td class="c97abb3"><div class="ck6mswf cdc4a4p c1ea3y3j"><div>MCRC Scheduling Integration</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>Nov 15, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>Nov 19, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div><button class="uvkj3lh b15h8fme bxji8yh f1tj3z0k" type="button"><span class="thmzqwx tu28qg5">Revoke</span></button></div></div></td></tr></tbody></table></div></div>
3. Click **"Create OAuth App"** or **"New OAuth App"**
4. Fill in the application details:
   - **App Name**: MCRC Scheduling Integration
   - **Kind of app**: Web
   - **Environment type**: Sandbox (for development) or Production (for production)
   - **Redirect URI**: 
     - Production: `https://mcrchoward.org/api/calendly/callback`
     - Development: `http://localhost:3000/api/calendly/callback`
     my https://developer.calendly.com/console/apps
     <div style="outline: none;" tabindex="-1"><div class="appsTable--cls2--613b3 appsTable--cls1--27d6d"><div class="appsTable--cls2--aef70 appsTable--cls1--1ac3a"><div class="appsTable--cls2--6abe1 appsTable--cls1--b2fa3"><h1>My Apps</h1><button class="uvkj3lh b15h8fme bzua8jl dyxacjh" type="button"><span class="t1850o97 tneybjo"><span class="i84knf7 ig3btk n1rp2nhq"></span>Create new app</span></button></div><hr></div><table class="atm_vy_1osqo2v atm_3f_1ktdpln atm_5v_idpfg4 atm_4a_us1cs3 atm_5j_1y44olf atm_2d_lzjfed atm_70_p8gy7z"><thead><tr class="t19sd0rs"><th class="tj0ud8n t9ce157"><div class="c1ume3ay c1yuni72"><button class="uvkj3lh s1es97wj" type="button"><span class="t19sd0rs">Name</span><span class="b15h8fme cy3eodl c1ofs1m3" aria-hidden="true"><svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" role="img"><path d="M2.5 3 5 .5 7.5 3M2.5 7 5 9.5 7.5 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></button></div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Created date</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Updated date</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Environment</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72">Redirect URI</div></th><th class="tj0ud8n"><div class="c1ume3ay c1yuni72"></div></th></tr></thead><tbody><tr class="r15404cu"><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div><p class="c18pvg3k cip1vwm c1a8y4oz" style="color: currentcolor;">Mediation and Conflict Resolution Center Production</p></div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>November 15th, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>November 17th, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>Production</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>https://mcrchoward.org/api/calendly/callback</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div><button type="button" class="uvkj3lh"><div class="itemActions--cls2--e9c92 itemActions--cls1--ca2cb"><span class="i84knf7 ig3btk n69ch1a"></span></div></button></div></div></td></tr><tr class="r15404cu"><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div><p class="c18pvg3k cip1vwm c1a8y4oz" style="color: currentcolor;">Mediation and Conflict Resolution Center Sandbox</p></div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>November 15th, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>November 17th, 2025</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>Sandbox</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div>http://localhost:3000/api/calendly/callback</div></div></td><td class="c97abb3"><div class="ck6mswf cdc4a4p"><div><button type="button" class="uvkj3lh"><div class="itemActions--cls2--e9c92 itemActions--cls1--ca2cb"><span class="i84knf7 ig3btk n69ch1a"></span></div></button></div></div></td></tr></tbody></table></div></div>
   - **Note**: Calendly OAuth does NOT support custom scopes. The app will automatically have access to all API endpoints permitted by your Calendly subscription and role. You do not need to configure scopes in the OAuth app settings.
5. Save and note your **Client ID** and **Client Secret**
I have saved the following in my .env as 
#Calendly SS
CALENDLY_ENCRYPTION_KEY=2JcFQWbm3q1ARlpnuR9rEd/e9cZLeI+LsWFr/lQNR1A=
CALENDLY_PERSONAL_ACCESS_TOKEN=eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzYzMjQ4OTcxLCJqdGkiOiI0MTY0MjA0ZC1iY2VhLTRhYjEtYWU0Ny01ZjU3MjVlYWJjZDMiLCJ1c2VyX3V1aWQiOiIxMmZmNzlhOC04Y2NmLTQ2N2ItOTdjNi02MjQxYmM5ZjZmN2IifQ.lYAqmDhn583RPWNR-9Lx9Oz-pbJ9oCBqYBw0zcZwuw58DSsyhK6Sb-LS88eudFFbUfPJ31k5JAIdhSAWVsxgHA

#Production
PRODUCTION_CALENDLY_CLIENT_ID=CDPq4EbjCyJUT4a-IZZyyyRpx--12p2P_W9nroceqiw
PRODUCTION_CALENDLY_CLIENT_SECRET=9wA1NWs2Oj0u-ZMDtz4jgk44WXt7Ro-8w8vSYxVHZOc
PRODUCTION_CALENDLY_REDIRECT_URI=https://mcrchoward.org/api/calendly/callback
PRODUCTION_CALENDLY_WEBHOOK_SIGNING_KEY=-FVTS7aowW3fSiqynX3oE3tBkTO8OHmdU2igCKEX05w

#Sandbox
SANDBOX_CALENDLY_CLIENT_ID=weFdIwz_16LkX3nRs3QVeSawdlpqW6CJUgaUN1Bfsfk
SANDBOX_CALENDLY_CLIENT_SECRET=LsBUCJEV-x3kUdH6y0dLRwHnTTRZhQadEHB8-7mhroE
SANDBOX_CALENDLY_REDIRECT_URI=http://localhost:3000/api/calendly/callback
SANDBOX_CALENDLY_WEBHOOK_SIGNING_KEY=gkMwaLhtIEYtAyISxGX_ncBCBwlqOCzzBznVFZZyaO4

### Important: Calendly OAuth Scope Behavior

**Calendly's OAuth implementation does NOT support custom scopes.** Once a user authorizes your application, it will have access to all API endpoints permitted by the user's subscription and role. This is different from many other OAuth providers.

- You do NOT need to configure scopes in the OAuth app settings
- You do NOT need to request specific scopes in the authorization URL
- The application automatically gets default access based on the Calendly account's permissions

## Step 2: Create Personal Access Token (for Webhooks)

**Important**: Calendly webhooks require a Personal Access Token, not OAuth tokens. This is different from the OAuth connection.

1. In Calendly, go to **Settings** → **Integrations** → **API & Webhooks**
2. Scroll to the **"Your personal access tokens"** section
3. Click **"Generate New Token"**
4. Give it a name (e.g., "MCRC Webhook Management")
5. Copy the token immediately (you won't be able to see it again)
6. Save it to your `.env.local` as `CALENDLY_PERSONAL_ACCESS_TOKEN`

**Note**: Personal access tokens created by admins grant access to all organization data. Keep this token secure.

## Step 3: Set Up Webhook (via API)

**Calendly does NOT provide a UI for creating webhooks.** Webhooks must be created via the Calendly API using your personal access token.

**Important Requirements:**
- Webhooks use **organization scope** (not user scope)
- Your Personal Access Token must have organization access
- The webhook URL must be publicly accessible (use a tunnel service for local development)
- Only specific events are supported: `invitee.created` and `invitee.canceled`

### Local Development: Public URL Options

For local development, you need a publicly accessible HTTPS URL. Here are several options:

#### Option 1: Cloudflare Tunnel (Recommended - Free, No Signup Required)

Cloudflare Tunnel (cloudflared) is a free, open-source tool that creates secure tunnels without requiring account setup for basic use.

1. **Install cloudflared:**
   ```bash
   # macOS
   brew install cloudflared
   
   # Linux (Ubuntu/Debian)
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Or download from: https://github.com/cloudflare/cloudflared/releases
   ```

2. **Start the tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.trycloudflare.com`) and add it to your `.env.local`:
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://abc123.trycloudflare.com
   ```

**Note:** The URL changes each time you restart the tunnel. For a stable URL, you can use Cloudflare Tunnel with a named tunnel (requires free Cloudflare account).

#### Option 2: localtunnel (Free, No Installation)

localtunnel is a simple npm package that creates public URLs.

1. **Install globally:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start the tunnel:**
   ```bash
   lt --port 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.loca.lt`) and add it to your `.env.local`:
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://abc123.loca.lt
   ```

**Note:** You may need to click through a browser warning on first use.

#### Option 3: serveo.net (Free, No Installation)

serveo uses SSH to create tunnels - no installation needed if you have SSH.

1. **Start the tunnel:**
   ```bash
   ssh -R 80:localhost:3000 serveo.net
   ```

2. **Copy the HTTPS URL** shown in the output and add it to your `.env.local`

#### Option 4: VS Code Port Forwarding (If using VS Code)

If you're using VS Code with the Remote Development extension:

1. Open the Command Palette (Cmd/Ctrl + Shift + P)
2. Run "Forward a Port"
3. Enter `3000`
4. Right-click the forwarded port and select "Port Visibility" → "Public"
5. Copy the public URL and add it to your `.env.local`

#### Option 5: ngrok (Requires Account for Stable URLs)

If you prefer ngrok:

1. **Sign up at** https://ngrok.com (free tier available)
2. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from: https://ngrok.com/download
   ```

3. **Authenticate:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

4. **Start the tunnel:**
   ```bash
   ngrok http 3000
   ```

5. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`) and add it to your `.env.local`:
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://abc123.ngrok-free.app
   ```

### Setting Up the Webhook

1. After connecting OAuth and setting up your personal access token, go to the Calendly Settings page in your dashboard
2. **For local development**, start one of the tunnel services above and set `NEXT_PUBLIC_SERVER_URL` in your `.env.local`
3. Restart your development server after updating environment variables
4. Click **"Create Webhook"** button in the Webhook Configuration section
5. The webhook will be automatically created with these events:
   - `invitee.created` - When someone schedules a meeting
   - `invitee.canceled` - When someone cancels a meeting
6. You'll see the webhook listed with its status and can delete it if needed

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Production Calendly OAuth
PRODUCTION_CALENDLY_CLIENT_ID=your_production_client_id
PRODUCTION_CALENDLY_CLIENT_SECRET=your_production_client_secret
PRODUCTION_CALENDLY_REDIRECT_URI=https://mcrchoward.org/api/calendly/callback
PRODUCTION_CALENDLY_WEBHOOK_SIGNING_KEY=your_production_webhook_key

# Sandbox/Development Calendly OAuth
SANDBOX_CALENDLY_CLIENT_ID=your_sandbox_client_id
SANDBOX_CALENDLY_CLIENT_SECRET=your_sandbox_client_secret
SANDBOX_CALENDLY_REDIRECT_URI=http://localhost:3000/api/calendly/callback
SANDBOX_CALENDLY_WEBHOOK_SIGNING_KEY=your_sandbox_webhook_key

# Personal Access Token (for webhook management)
CALENDLY_PERSONAL_ACCESS_TOKEN=your_personal_access_token

# Server URL (required for webhook creation)
# Production: https://mcrchoward.org
# Local Development: Use ngrok URL (e.g., https://abc123.ngrok.io)
NEXT_PUBLIC_SERVER_URL=https://mcrchoward.org

# Encryption Key (generate with: openssl rand -base64 32)
CALENDLY_ENCRYPTION_KEY=your_32_character_base64_key
```

**Notes:**
- The `CALENDLY_PERSONAL_ACCESS_TOKEN` is required for creating and managing webhooks via the API. This is separate from OAuth tokens.
- `NEXT_PUBLIC_SERVER_URL` is required for webhook creation. For local development, use a tunnel service URL (Cloudflare Tunnel, localtunnel, serveo, etc.). For production, use your production domain.
- Webhooks are created with **organization scope**, so your Personal Access Token must have organization-level access.

## Step 5: Generate Encryption Key

The encryption key is used to securely store OAuth tokens in Firestore. Generate a secure key:

```bash
openssl rand -base64 32
```

Copy the output and add it to `CALENDLY_ENCRYPTION_KEY` in your `.env.local`.

**Important**: Keep this key secure and never commit it to version control.

## Step 6: Connect Calendly in Admin Dashboard

1. Start your development server: `pnpm dev`
2. Log in to the admin dashboard
3. Navigate to **Settings** → **Calendly**
4. Click **"Connect Calendly"** button
5. Authorize the application in the Calendly popup
6. You should see a success message and connection status

## Step 7: Create Webhook Subscription

1. After connecting OAuth, you'll see a "Webhook Configuration" section
2. Make sure both `CALENDLY_PERSONAL_ACCESS_TOKEN` and `NEXT_PUBLIC_SERVER_URL` are set in your `.env.local`
3. **For Local Development**: Start a tunnel service (see Step 3 for options) and set `NEXT_PUBLIC_SERVER_URL` to the tunnel URL:
   ```bash
   # Example using Cloudflare Tunnel (recommended):
   cloudflared tunnel --url http://localhost:3000
   # Copy the https:// URL and add to .env.local:
   # NEXT_PUBLIC_SERVER_URL=https://abc123.trycloudflare.com
   ```
4. Restart your development server after updating environment variables
5. Click **"Create Webhook"** button in the Webhook Configuration section
6. The webhook will be automatically created with organization scope and configured for:
   - `invitee.created` events
   - `invitee.canceled` events
7. You'll see the webhook listed with its status, callback URL, and events
8. You can delete webhooks using the trash icon if needed

## Step 8: Configure Event Type Mappings

1. In the Calendly settings page, you'll see available event types
2. Map each form type to a Calendly event type:
   - Mediation Self-Referral → Select appropriate event type
   - Restorative Program Referral → Select appropriate event type
   - Group Facilitation Inquiry → Select appropriate event type
3. Save the mappings

## Rotating Secrets

### Rotating OAuth Credentials

If you need to rotate OAuth credentials:

1. Create a new OAuth app in Calendly
2. Update environment variables with new Client ID and Secret
3. Reconnect Calendly in the admin dashboard
4. Old tokens will be automatically replaced

### Rotating Webhook Signing Key

1. Create a new webhook in Calendly
2. Update `PRODUCTION_CALENDLY_WEBHOOK_SIGNING_KEY` or `SANDBOX_CALENDLY_WEBHOOK_SIGNING_KEY`
3. Delete the old webhook after verifying the new one works

### Rotating Encryption Key

**Warning**: Rotating the encryption key will require re-authenticating Calendly.

1. Generate a new encryption key: `openssl rand -base64 32`
2. Update `CALENDLY_ENCRYPTION_KEY` in `.env.local`
3. Reconnect Calendly in the admin dashboard
4. Old encrypted tokens will be replaced

## Troubleshooting

### OAuth Connection Fails

- Verify redirect URIs match exactly in Calendly and environment variables
- Check that Client ID and Secret are correct
- Ensure the OAuth app is active in Calendly

### Webhook Creation Fails

- **"Invalid Argument" error**: Make sure `NEXT_PUBLIC_SERVER_URL` is set to a publicly accessible HTTPS URL (use a tunnel service for local dev, production domain for production)
- **"Organization is missing" error**: Your Personal Access Token must have organization access. Create the token as an admin user.
- **"Invalid URL" error**: The webhook URL must be a valid HTTPS URL. For local development, use a tunnel service (Cloudflare Tunnel, localtunnel, serveo, or ngrok) to create an HTTPS tunnel.
- **"Events parameter invalid" error**: Only specific events are supported. The system automatically uses `invitee.created` and `invitee.canceled`.

### Webhook Not Receiving Events

- Verify webhook URL is accessible (use a tunnel service for local development)
- Check webhook signing key matches
- Review Calendly webhook logs for delivery status
- Ensure webhook is in "active" state (check the webhook list in the dashboard)
- Verify the webhook was created with organization scope (not user scope)
- **Note**: If using a tunnel service, make sure the tunnel is still running when testing webhooks

### Token Refresh Issues

- Check that tokens are stored correctly in Firestore `settings/calendly`
- Verify encryption key is correct
- Review server logs for refresh errors

### Decryption Errors

If you see `[Encryption] Failed to decrypt` errors:

- **Cause**: The stored OAuth tokens in Firestore were encrypted with a different encryption key than what's currently in your `.env.local`
- **Solution**: Reconnect Calendly in the admin dashboard (Settings → Calendly → Disconnect, then Connect again). This will re-encrypt the tokens with your current encryption key.
- **Alternative**: If you have the old encryption key, you can temporarily use it to decrypt existing tokens, then reconnect with the new key.
- **Prevention**: Keep your `CALENDLY_ENCRYPTION_KEY` consistent across environments. If you need to rotate it, plan to reconnect Calendly after the rotation.

## Security Best Practices

1. **Never commit secrets**: Use `.env.local` (already in `.gitignore`)
2. **Use different credentials**: Separate production and sandbox environments
3. **Rotate regularly**: Update OAuth credentials and encryption keys periodically
4. **Monitor access**: Review Calendly OAuth app access logs regularly
5. **Limit scopes**: Only request necessary OAuth scopes

## Support

For issues or questions:
- Check Calendly API documentation: https://developer.calendly.com/
- Review application logs in the admin dashboard
- Contact the development team

