// Google Sign-In using Google Identity Services (GIS)
import { getSetting, setSetting, removeSetting } from './settingsStorage';

const CLIENT_ID = '52777395492-vnlk2hkr3pv15dtpgp2m51p7418vll90.apps.googleusercontent.com';
const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  expiresAt: number;
}

let tokenClient: any = null;
let gisLoaded = false;

// Load the GIS script
export const loadGoogleIdentityServices = (): Promise<void> => {
  if (gisLoaded) return Promise.resolve();
  
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.accounts?.oauth2) {
      gisLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Initialize the token client
const initTokenClient = (onSuccess: (token: string) => void, onError: (err: any) => void) => {
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services not loaded'));
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: any) => {
      if (response.error) {
        onError(response);
        return;
      }
      onSuccess(response.access_token);
    },
    error_callback: (error: any) => {
      onError(error);
    },
  });
};

// Sign in with Google
export const signInWithGoogle = (): Promise<GoogleUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleIdentityServices();

      initTokenClient(
        async (accessToken: string) => {
          try {
            // Fetch user info with retry
            let res: Response | null = null;
            for (let attempt = 0; attempt < 3; attempt++) {
              try {
                if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
                res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.ok) break;
              } catch (fetchErr) {
                console.warn(`Userinfo fetch attempt ${attempt + 1} failed:`, fetchErr);
                if (attempt === 2) throw new Error('Network error fetching user info. Please check your connection and try again.');
              }
            }

            if (!res || !res.ok) throw new Error('Failed to fetch user info. Please try again.');

            const userInfo = await res.json();
            const user: GoogleUser = {
              email: userInfo.email,
              name: userInfo.name || userInfo.email,
              picture: userInfo.picture || '',
              accessToken,
              expiresAt: Date.now() + 3600 * 1000, // 1 hour
            };

            // Persist
            await setSetting('googleUser', user);
            resolve(user);
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(err)
      );

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

// Sign out
export const signOutGoogle = async (): Promise<void> => {
  const user = await getStoredGoogleUser();
  if (user?.accessToken) {
    try {
      const google = (window as any).google;
      google?.accounts?.oauth2?.revoke?.(user.accessToken);
    } catch {}
  }
  await removeSetting('googleUser');
};

// Get stored user
export const getStoredGoogleUser = async (): Promise<GoogleUser | null> => {
  return getSetting<GoogleUser | null>('googleUser', null);
};

// Check if token is still valid
export const isTokenValid = (user: GoogleUser): boolean => {
  return user.expiresAt > Date.now() + 60000; // 1 min buffer
};

// Refresh token silently
export const refreshGoogleToken = (): Promise<GoogleUser> => {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleIdentityServices();

      initTokenClient(
        async (accessToken: string) => {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error('Failed to refresh user info');
            const userInfo = await res.json();

            const user: GoogleUser = {
              email: userInfo.email,
              name: userInfo.name || userInfo.email,
              picture: userInfo.picture || '',
              accessToken,
              expiresAt: Date.now() + 3600 * 1000,
            };

            await setSetting('googleUser', user);
            resolve(user);
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(err)
      );

      // Use prompt: '' for silent refresh
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

// Get a valid access token (refreshes if needed)
export const getValidAccessToken = async (): Promise<string | null> => {
  const user = await getStoredGoogleUser();
  if (!user) return null;

  if (isTokenValid(user)) {
    return user.accessToken;
  }

  try {
    const refreshed = await refreshGoogleToken();
    return refreshed.accessToken;
  } catch {
    return null;
  }
};
