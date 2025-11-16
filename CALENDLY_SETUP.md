# Calendly Integration Setup Guide

This guide explains how to set up and configure Calendly OAuth integration for the MCRC application.

## Prerequisites

1. A Calendly account (free or paid)
2. Access to Calendly Developer Settings
3. Firebase Admin credentials configured

## Step 1: Create Calendly OAuth Application

1. Log in to your Calendly account
2. Navigate to **Settings** → **Integrations** → **API & Webhooks**
3. Click **"Create OAuth App"** or **"New OAuth App"**
4. Fill in the application details:
   - **App Name**: MCRC Scheduling Integration
   - **Kind of app**: Web
   - **Environment type**: Sandbox (for development) or Production (for production)
   - **Redirect URI**: 
     - Production: `https://mcrchoward.org/api/calendly/callback`
     - Development: `http://localhost:3000/api/calendly/callback`
   - **Note**: Calendly OAuth does NOT support custom scopes. The app will automatically have access to all API endpoints permitted by your Calendly subscription and role. You do not need to configure scopes in the OAuth app settings.
5. Save and note your **Client ID** and **Client Secret**

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
- The webhook URL must be publicly accessible (use ngrok for local development)
- Only specific events are supported: `invitee.created` and `invitee.canceled`

1. After connecting OAuth and setting up your personal access token, go to the Calendly Settings page in your dashboard
2. For **local development**, set up ngrok first:
   ```bash
   ngrok http 3000
   ```
   Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and add it to your `.env.local`:
   ```bash
   NEXT_PUBLIC_SERVER_URL=https://abc123.ngrok.io
   ```
3. Click **"Create Webhook"** button in the Webhook Configuration section
4. The webhook will be automatically created with these events:
   - `invitee.created` - When someone schedules a meeting
   - `invitee.canceled` - When someone cancels a meeting
5. You'll see the webhook listed with its status and can delete it if needed

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
- `NEXT_PUBLIC_SERVER_URL` is required for webhook creation. For local development, use an ngrok URL. For production, use your production domain.
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
3. **For Local Development**: Start ngrok and set `NEXT_PUBLIC_SERVER_URL` to the ngrok URL:
   ```bash
   ngrok http 3000
   # Copy the https:// URL and add to .env.local:
   # NEXT_PUBLIC_SERVER_URL=https://abc123.ngrok.io
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

- **"Invalid Argument" error**: Make sure `NEXT_PUBLIC_SERVER_URL` is set to a publicly accessible URL (ngrok for local dev, production domain for production)
- **"Organization is missing" error**: Your Personal Access Token must have organization access. Create the token as an admin user.
- **"Invalid URL" error**: The webhook URL must be a valid HTTPS URL. For local development, use ngrok to create an HTTPS tunnel.
- **"Events parameter invalid" error**: Only specific events are supported. The system automatically uses `invitee.created` and `invitee.canceled`.

### Webhook Not Receiving Events

- Verify webhook URL is accessible (use ngrok for local development)
- Check webhook signing key matches
- Review Calendly webhook logs for delivery status
- Ensure webhook is in "active" state (check the webhook list in the dashboard)
- Verify the webhook was created with organization scope (not user scope)

### Token Refresh Issues

- Check that tokens are stored correctly in Firestore `settings/calendly`
- Verify encryption key is correct
- Review server logs for refresh errors

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

