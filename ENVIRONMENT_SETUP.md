# Environment Setup Guide

This guide explains how to set up environment variables for SnapConnect to keep sensitive configuration secure.

## Quick Setup

1. **Copy the example file:**
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit the `.env` file** with your actual configuration values:
   ```powershell
   notepad .env
   ```

3. **Never commit the `.env` file** - it's already in `.gitignore`

## Required Environment Variables

### Firebase Configuration
These are required for the app to function. Get them from your Firebase project console:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### API Configuration
Configure your API endpoints:

```env
EXPO_PUBLIC_API_BASE_URL_DEV=http://localhost:3000
EXPO_PUBLIC_API_BASE_URL_PROD=https://api.snapconnect.com
```

## Getting Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Click on your web app or add a new web app
6. Copy the configuration values to your `.env` file

## Optional Configuration

### AI Services
When you're ready to integrate AI features:

```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Gaming Platform APIs
For gaming integrations:

```env
STEAM_API_KEY=your_steam_api_key_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
```

## Security Best Practices

- ✅ **DO**: Keep `.env` in `.gitignore`
- ✅ **DO**: Use different Firebase projects for dev/staging/production
- ✅ **DO**: Rotate API keys regularly
- ✅ **DO**: Use the `.env.example` file as a template for team members

- ❌ **DON'T**: Commit `.env` files to version control
- ❌ **DON'T**: Share API keys in Slack/Discord/email
- ❌ **DON'T**: Use production keys in development
- ❌ **DON'T**: Hardcode secrets in source code

## Troubleshooting

### "Missing required Firebase environment variables" Error
This means one or more required environment variables are not set. Check that:
1. Your `.env` file exists in the project root
2. All Firebase variables are set with valid values
3. There are no typos in variable names
4. You've restarted the development server after adding variables

### Environment Variables Not Loading
- Make sure your `.env` file is in the project root directory
- Restart your development server (`npm start` or `expo start`)
- For Expo, variables must start with `EXPO_PUBLIC_` to be accessible in client code

## Team Setup

When a new team member joins:
1. They should copy `.env.example` to `.env`
2. Get the actual configuration values from a team lead (never commit these to git)
3. Fill in their `.env` file with the provided values

This keeps everyone's environment consistent while maintaining security. 
