# Google Drive Sync - Native Setup Guide

This guide covers setting up native Google Sign-In for the NPD app using `@capgo/capacitor-social-login` (v8.x) with Capacitor 8, enabling Google Drive sync on Android and iOS.

---

## Prerequisites

- Capacitor 8 project with `@capgo/capacitor-social-login@^8.2.17`
- Google Cloud Console project with OAuth 2.0 credentials
- Web Client ID: `52777395492-vnlk2hkr3pv15dtpgp2m51p7418vll90.apps.googleusercontent.com`

---

## Android Setup

### 1. Get SHA-1 Fingerprint

```bash
cd android
./gradlew signingReport
```

Copy the SHA-1 fingerprint from the output.

### 2. Create Android OAuth Client ID

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth Client ID**
3. Choose **Android** as application type
4. Enter package name: `nota.npd.com`
5. Paste your SHA-1 fingerprint
6. Click **Create**

> **Note:** You do NOT use the Android Client ID in code. You always use the **Web Client ID**. The Android Client ID is only for Google's verification.

### 3. Modify `MainActivity.java`

Open `android/app/src/main/java/nota/npd/com/MainActivity.java` and replace with:

```java
package nota.npd.com;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Register the Social Login plugin with Google provider
        SocialLoginPlugin.registerPlugin(this);
        GoogleProvider.initialize(this);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        SocialLoginPlugin.onActivityResult(requestCode, resultCode, data);
    }
}
```

### 4. Add Google Services (Optional for Firebase)

If you're using Firebase for additional features, add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

And place your `google-services.json` in `android/app/`.

---

## TypeScript Usage

### Initialize Social Login

Call this once at app startup (e.g., in `App.tsx` or a context provider):

```typescript
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

const initializeNativeAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    await SocialLogin.initialize({
      google: {
        webClientId: '52777395492-vnlk2hkr3pv15dtpgp2m51p7418vll90.apps.googleusercontent.com',
      },
    });
  }
};
```

### Sign In (Native)

```typescript
import { SocialLogin } from '@capgo/capacitor-social-login';

const nativeGoogleSignIn = async () => {
  const result = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/drive.file',
      ],
    },
  });

  // result.result contains:
  // - accessToken.token (the OAuth access token)
  // - idToken (JWT with user info)
  // - profile (email, name, picture, etc.)

  return result;
};
```

### Platform-Aware Sign In

The app uses a unified approach — native on Android/iOS, GIS (Google Identity Services) on web:

```typescript
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

export const signIn = async () => {
  if (Capacitor.isNativePlatform()) {
    // Use Capgo Social Login for native
    const result = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: [
          'openid', 'email', 'profile',
          'https://www.googleapis.com/auth/drive.appdata',
          'https://www.googleapis.com/auth/drive.file',
        ],
      },
    });
    return {
      email: result.result.profile?.email,
      name: result.result.profile?.name,
      picture: result.result.profile?.imageUrl,
      accessToken: result.result.accessToken?.token,
      expiresAt: Date.now() + 3600 * 1000,
    };
  } else {
    // Use GIS for web (existing implementation)
    const { signInWithGoogle } = await import('./googleAuth');
    return signInWithGoogle();
  }
};
```

---

## Google Drive Sync Architecture

The sync system uses Google Drive's `appDataFolder` (hidden app-specific storage) to store:

| File | Description |
|------|-------------|
| `npd-notes.json` | All notes with metadata |
| `npd-tasks.json` | All todo items and subtasks |
| `npd-settings.json` | Synced app settings (folders, theme, etc.) |
| `npd-sync-meta.json` | Sync metadata (device ID, change tokens, versions) |

### Sync Flow

1. **Authentication** → Get valid access token (refresh if expired)
2. **List remote files** → Check what exists in Drive `appDataFolder`
3. **Download & merge** → Merge remote data with local using last-write-wins + conflict detection
4. **Upload** → Push merged data back to Drive
5. **Update meta** → Store change token for incremental sync

### Conflict Resolution

- **Last-write-wins** for most cases (based on `updatedAt` timestamp)
- **Conflict UI** when same timestamp but different `syncVersion` or content
- Users can choose **Keep Local** or **Keep Remote** via `SyncConflictSheet`

---

## Required OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `openid` | OpenID Connect authentication |
| `email` | User email address |
| `profile` | User name and profile picture |
| `drive.appdata` | Read/write to app-specific hidden folder |
| `drive.file` | Access files created by the app |

---

## Troubleshooting

### Common Issues

1. **`DEVELOPER_ERROR` on Android**
   - Verify SHA-1 fingerprint matches your keystore
   - Ensure package name is exactly `nota.npd.com`
   - Make sure you're using the **Web Client ID**, not Android Client ID

2. **Sign-in popup doesn't appear on web**
   - Add your domain to Authorized JavaScript Origins in Google Cloud Console
   - Ensure `https://accounts.google.com/gsi/client` script loads

3. **Token expired during sync**
   - The app auto-refreshes tokens via `getValidAccessToken()`
   - If silent refresh fails, user must sign in again

4. **`i.getTime is not a function`**
   - Fixed by safe date normalization in hydrate functions
   - All date fields go through `safeDate()` helper

---

## Building for Production

```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Run on device
npx cap run android
```
