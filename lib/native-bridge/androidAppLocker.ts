import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  InstalledApp,
  ProtectedApp,
  UnlockSession,
  WorkoutSessionLog,
  AppProtectionSettings,
} from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

export interface PushLockAppLockerPluginInterface {
  getInstalledApps(options?: { includeIcons?: boolean }): Promise<{ apps: InstalledApp[] }>;
  getProtectedApps(): Promise<{ apps: ProtectedApp[] }>;
  protectApp(options: {
    packageName: string;
    name: string;
    targetReps: number;
    unlockMinutes: number;
    category?: string;
    iconName?: string;
    color?: string;
  }): Promise<ProtectedApp>;
  unprotectApp(options: { packageName: string }): Promise<{ success: boolean }>;
  toggleProtection(options: { packageName: string; isProtected: boolean }): Promise<{ success: boolean }>;
  deleteApp(options: { packageName: string }): Promise<{ success: boolean }>;
  getProtectionStatus(options: { packageName: string }): Promise<{
    isProtected: boolean;
    isLocked: boolean;
    remainingSeconds: number;
    app?: ProtectedApp;
  }>;
  unlockApp(options: {
    packageName: string;
    durationMinutes: number;
    repsCompleted: number;
    autoLaunch?: boolean;
  }): Promise<UnlockSession>;
  lockApp(options: { packageName: string }): Promise<{ success: boolean }>;
  getActiveUnlockSessions(): Promise<{ sessions: UnlockSession[] }>;
  getRemainingUnlockTime(options: { packageName: string }): Promise<{ remainingSeconds: number }>;
  isProtectionServiceEnabled(): Promise<{ enabled: boolean; serviceRunning: boolean; settingsEnabled: boolean }>;
  openProtectionSettings(): Promise<{ success: boolean }>;
  launchApp(options: { packageName: string }): Promise<{ success: boolean }>;
  getPendingLockTrigger(): Promise<{ hasTrigger: boolean; lockTrigger?: ProtectedApp }>;
  addListener(
    eventName: 'appLockTriggered',
    listenerFunc: (data: ProtectedApp) => void
  ): Promise<PluginListenerHandle>;
}

// Register native Capacitor plugin
const NativeLocker = registerPlugin<PushLockAppLockerPluginInterface>('PushLockAppLocker');

// Pre-configured default demo catalogue for Web preview mode
export const DEFAULT_DEMO_APPS: ProtectedApp[] = [
  {
    id: 'app-instagram',
    packageName: 'com.instagram.android',
    name: 'Instagram',
    category: 'social',
    iconName: 'instagram',
    color: '#E1306C',
    targetReps: 20,
    unlockMinutes: 15,
    isProtected: true,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
  {
    id: 'app-youtube',
    packageName: 'com.google.android.youtube',
    name: 'YouTube',
    category: 'entertainment',
    iconName: 'youtube',
    color: '#FF0000',
    targetReps: 25,
    unlockMinutes: 20,
    isProtected: true,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
  {
    id: 'app-snapchat',
    packageName: 'com.snapchat.android',
    name: 'Snapchat',
    category: 'social',
    iconName: 'snapchat',
    color: '#FFFC00',
    targetReps: 15,
    unlockMinutes: 10,
    isProtected: true,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
  {
    id: 'app-tiktok',
    packageName: 'com.zhiliaoapp.musically',
    name: 'TikTok',
    category: 'social',
    iconName: 'tiktok',
    color: '#000000',
    targetReps: 30,
    unlockMinutes: 15,
    isProtected: false,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
  {
    id: 'app-reddit',
    packageName: 'com.reddit.frontpage',
    name: 'Reddit',
    category: 'social',
    iconName: 'reddit',
    color: '#FF4500',
    targetReps: 15,
    unlockMinutes: 15,
    isProtected: true,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
  {
    id: 'app-facebook',
    packageName: 'com.facebook.katana',
    name: 'Facebook',
    category: 'social',
    iconName: 'facebook',
    color: '#1877F2',
    targetReps: 20,
    unlockMinutes: 15,
    isProtected: false,
    timesUnlockedToday: 0,
    totalUnlocks: 0,
    lastUnlockedAt: null,
  },
];

export const DEFAULT_PROTECTION_SETTINGS: AppProtectionSettings = {
  defaultUnlockMinutes: 15,
  defaultPushUpTarget: 20,
  strictLockMode: true,
  autoRelockOnScreenOff: true,
  vibrationOnLock: true,
  notifyOnExpire: true,
};

const STORAGE_KEYS = {
  PROTECTED_APPS: 'pushlock_protected_apps',
  UNLOCK_SESSIONS: 'pushlock_unlock_sessions',
  WORKOUT_HISTORY: 'pushlock_workout_history',
  PROTECTION_SETTINGS: 'pushlock_protection_settings',
  INSTALLED_APPS_CACHE: 'pushlock_installed_apps_cache',
};

type LockTriggerListener = (app: ProtectedApp) => void;

/**
 * Android Native App Locker Bridge Service
 * Transparently bridges React to the real Kotlin Native App Locker when running in the Android App,
 * and maintains a local demo simulation when running in a standard web browser.
 */
export class AndroidAppLockerService {
  private static instance: AndroidAppLockerService;
  private isNative: boolean = false;
  private lockTriggerListeners: Set<LockTriggerListener> = new Set();
  private nativeListenerHandle: PluginListenerHandle | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isNative = Capacitor.isNativePlatform();
      this.initNativeListener();
    }
  }

  public static getInstance(): AndroidAppLockerService {
    if (!AndroidAppLockerService.instance) {
      AndroidAppLockerService.instance = new AndroidAppLockerService();
    }
    return AndroidAppLockerService.instance;
  }

  private async initNativeListener() {
    if (!this.isNative) return;
    try {
      this.nativeListenerHandle = await NativeLocker.addListener(
        'appLockTriggered',
        (data: ProtectedApp) => {
          this.lockTriggerListeners.forEach((fn) => fn(data));
        }
      );
    } catch (e) {
      console.warn('Native lock listener registration failed:', e);
    }
  }

  /**
   * Subscribe to native app lock trigger events (when user opens a protected app on Android)
   */
  public onLockTriggered(listener: LockTriggerListener): () => void {
    this.lockTriggerListeners.add(listener);
    return () => {
      this.lockTriggerListeners.delete(listener);
    };
  }

  /**
   * Check for any pending lock trigger intent on app resume / mount
   */
  public async checkPendingLockTrigger(): Promise<ProtectedApp | null> {
    if (!this.isNative) return null;
    try {
      const res = await NativeLocker.getPendingLockTrigger();
      if (res.hasTrigger && res.lockTrigger) {
        return res.lockTrigger;
      }
      return null;
    } catch {
      return null;
    }
  }

  public isNativeAndroid(): boolean {
    return this.isNative;
  }

  /**
   * Queries real installed launchable apps on Android or demo list on Web.
   */
  public async getInstalledApps(): Promise<InstalledApp[]> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.getInstalledApps({ includeIcons: true });
        if (res?.apps?.length > 0) {
          // Cache in localStorage for quick initial render
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEYS.INSTALLED_APPS_CACHE, JSON.stringify(res.apps));
            } catch {}
          }
          return res.apps;
        }
      } catch (e) {
        console.error('Failed to query native installed apps:', e);
      }
    }

    // Try cached apps
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(STORAGE_KEYS.INSTALLED_APPS_CACHE);
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    // Web preview fallback
    return [
      { packageName: 'com.instagram.android', name: 'Instagram', category: 'social', iconName: 'instagram', color: '#E1306C' },
      { packageName: 'com.google.android.youtube', name: 'YouTube', category: 'entertainment', iconName: 'youtube', color: '#FF0000' },
      { packageName: 'com.snapchat.android', name: 'Snapchat', category: 'social', iconName: 'snapchat', color: '#FFFC00' },
      { packageName: 'com.zhiliaoapp.musically', name: 'TikTok', category: 'social', iconName: 'tiktok', color: '#000000' },
      { packageName: 'com.reddit.frontpage', name: 'Reddit', category: 'social', iconName: 'reddit', color: '#FF4500' },
      { packageName: 'com.facebook.katana', name: 'Facebook', category: 'social', iconName: 'facebook', color: '#1877F2' },
      { packageName: 'com.twitter.android', name: 'X (Twitter)', category: 'social', iconName: 'twitter', color: '#0F1419' },
    ];
  }

  /**
   * Retrieves protected apps list from native storage or web local storage.
   */
  public async getProtectedAppsAsync(): Promise<ProtectedApp[]> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.getProtectedApps();
        if (res?.apps) {
          this.saveProtectedAppsToLocalStorage(res.apps);
          return res.apps;
        }
      } catch (e) {
        console.error('Failed to fetch native protected apps:', e);
      }
    }
    return this.getProtectedApps();
  }

  public getProtectedApps(): ProtectedApp[] {
    if (typeof window === 'undefined') return DEFAULT_DEMO_APPS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROTECTED_APPS);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEYS.PROTECTED_APPS, JSON.stringify(DEFAULT_DEMO_APPS));
      return DEFAULT_DEMO_APPS;
    } catch {
      return DEFAULT_DEMO_APPS;
    }
  }

  private saveProtectedAppsToLocalStorage(apps: ProtectedApp[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROTECTED_APPS, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to save protected apps cache:', e);
    }
  }

  /**
   * Protect an app with rep target and unlock duration
   */
  public async protectApp(
    packageName: string,
    appName: string,
    targetReps: number,
    unlockMinutes: number,
    category: ProtectedApp['category'] = 'custom',
    iconName: string = 'shield',
    color: string = '#16A34A'
  ): Promise<ProtectedApp> {
    if (this.isNative) {
      try {
        const nativeApp = await NativeLocker.protectApp({
          packageName,
          name: appName,
          targetReps,
          unlockMinutes,
          category,
          iconName,
          color,
        });
        const current = this.getProtectedApps();
        const filtered = current.filter((a) => a.packageName !== packageName);
        filtered.unshift(nativeApp);
        this.saveProtectedAppsToLocalStorage(filtered);
        triggerHaptic('click');
        return nativeApp;
      } catch (e) {
        console.error('Native protectApp failed:', e);
      }
    }

    // Local Web simulation
    const apps = this.getProtectedApps();
    const existingIndex = apps.findIndex((a) => a.packageName === packageName);
    let updatedApp: ProtectedApp;

    if (existingIndex >= 0) {
      updatedApp = {
        ...apps[existingIndex],
        name: appName,
        targetReps,
        unlockMinutes,
        isProtected: true,
      };
      apps[existingIndex] = updatedApp;
    } else {
      updatedApp = {
        id: `app-${Date.now()}`,
        packageName,
        name: appName,
        category,
        iconName,
        color,
        targetReps,
        unlockMinutes,
        isProtected: true,
        timesUnlockedToday: 0,
        totalUnlocks: 0,
        lastUnlockedAt: null,
      };
      apps.unshift(updatedApp);
    }

    this.saveProtectedAppsToLocalStorage(apps);
    triggerHaptic('click');
    return updatedApp;
  }

  /**
   * Unprotect an app
   */
  public async unprotectApp(packageName: string): Promise<boolean> {
    if (this.isNative) {
      try {
        await NativeLocker.unprotectApp({ packageName });
      } catch (e) {
        console.error('Native unprotectApp failed:', e);
      }
    }

    const apps = this.getProtectedApps();
    const updated = apps.map((app) =>
      app.packageName === packageName ? { ...app, isProtected: false } : app
    );
    this.saveProtectedAppsToLocalStorage(updated);
    triggerHaptic('click');
    return true;
  }

  /**
   * Toggle protection switch
   */
  public async toggleProtection(packageName: string, isProtected: boolean): Promise<boolean> {
    if (this.isNative) {
      try {
        await NativeLocker.toggleProtection({ packageName, isProtected });
      } catch (e) {
        console.error('Native toggleProtection failed:', e);
      }
    }

    const apps = this.getProtectedApps();
    const updated = apps.map((app) =>
      app.packageName === packageName ? { ...app, isProtected } : app
    );
    this.saveProtectedAppsToLocalStorage(updated);
    triggerHaptic('click');
    return true;
  }

  /**
   * Delete an app
   */
  public async deleteApp(packageName: string): Promise<boolean> {
    if (this.isNative) {
      try {
        await NativeLocker.deleteApp({ packageName });
      } catch (e) {
        console.error('Native deleteApp failed:', e);
      }
    }

    const apps = this.getProtectedApps();
    const updated = apps.filter((app) => app.packageName !== packageName);
    this.saveProtectedAppsToLocalStorage(updated);
    return true;
  }

  /**
   * Get protection status
   */
  public async getProtectionStatus(packageName: string): Promise<{ isProtected: boolean; isLocked: boolean; app: ProtectedApp | null }> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.getProtectionStatus({ packageName });
        return {
          isProtected: res.isProtected,
          isLocked: res.isLocked,
          app: res.app || null,
        };
      } catch (e) {
        console.error('Native getProtectionStatus failed:', e);
      }
    }

    const apps = this.getProtectedApps();
    const app = apps.find((a) => a.packageName === packageName) || null;
    const isLocked = app ? (app.isProtected && this.getRemainingUnlockTime(packageName) === 0) : false;
    return {
      isProtected: !!app?.isProtected,
      isLocked,
      app,
    };
  }

  /**
   * Unlock app temporarily after completing verified push-ups
   */
  public async unlockApp(
    packageName: string,
    durationMinutes: number,
    repsCompleted: number,
    autoLaunch: boolean = true
  ): Promise<UnlockSession> {
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    const apps = this.getProtectedApps();
    const targetApp = apps.find((a) => a.packageName === packageName);
    const appName = targetApp ? targetApp.name : packageName;

    // 1. Call Native Android Plugin to write unlockUntil and launch target app
    if (this.isNative) {
      try {
        await NativeLocker.unlockApp({
          packageName,
          durationMinutes,
          repsCompleted,
          autoLaunch,
        });
      } catch (e) {
        console.error('Native unlockApp failed:', e);
      }
    }

    // 2. Update local state
    const updatedApps = apps.map((a) => {
      if (a.packageName === packageName) {
        return {
          ...a,
          timesUnlockedToday: a.timesUnlockedToday + 1,
          totalUnlocks: a.totalUnlocks + 1,
          lastUnlockedAt: now,
        };
      }
      return a;
    });
    this.saveProtectedAppsToLocalStorage(updatedApps);

    // 3. Save active unlock session
    const sessions = this.getActiveUnlockSessions();
    const filteredSessions = sessions.filter((s) => s.packageName !== packageName);

    const newSession: UnlockSession = {
      packageName,
      appName,
      unlockedAt: now,
      expiresAt,
      durationMinutes,
      repsCompleted,
      isActive: true,
    };

    filteredSessions.push(newSession);
    this.saveUnlockSessions(filteredSessions);

    // 4. Log workout session to history
    this.logWorkoutSession({
      id: `workout-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: now,
      reps: repsCompleted,
      durationSeconds: Math.round(repsCompleted * 2.8),
      unlockedAppName: appName,
      unlockedPackageName: packageName,
      formAccuracy: 95,
      caloriesBurned: Math.round(repsCompleted * 0.45),
      type: 'app_unlock',
    });

    triggerHaptic('success');
    return newSession;
  }

  /**
   * Launch an app explicitly
   */
  public async launchApp(packageName: string): Promise<boolean> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.launchApp({ packageName });
        return res.success;
      } catch (e) {
        console.error('Failed to launch app:', e);
      }
    }
    return false;
  }

  /**
   * Relock an app manually
   */
  public async lockApp(packageName: string): Promise<boolean> {
    if (this.isNative) {
      try {
        await NativeLocker.lockApp({ packageName });
      } catch (e) {
        console.error('Native lockApp failed:', e);
      }
    }

    const sessions = this.getActiveUnlockSessions();
    const updated = sessions.filter((s) => s.packageName !== packageName);
    this.saveUnlockSessions(updated);
    triggerHaptic('lock');
    return true;
  }

  /**
   * Get active unlock sessions
   */
  public getActiveUnlockSessions(): UnlockSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.UNLOCK_SESSIONS);
      if (!stored) return [];

      const sessions: UnlockSession[] = JSON.parse(stored);
      const now = Date.now();
      const validSessions = sessions.filter((s) => s.expiresAt > now && s.isActive);

      if (validSessions.length !== sessions.length) {
        this.saveUnlockSessions(validSessions);
      }
      return validSessions;
    } catch {
      return [];
    }
  }

  private saveUnlockSessions(sessions: UnlockSession[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save unlock sessions:', e);
    }
  }

  public getRemainingUnlockTime(packageName: string): number {
    const sessions = this.getActiveUnlockSessions();
    const session = sessions.find((s) => s.packageName === packageName);
    if (!session) return 0;

    const remainingMs = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }

  /**
   * Check if Android Accessibility App Protection Service is enabled
   */
  public async isProtectionServiceEnabled(): Promise<boolean> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.isProtectionServiceEnabled();
        return res.enabled;
      } catch (e) {
        console.error('Failed to check protection service status:', e);
      }
    }
    return true; // Web preview returns true to allow full testing
  }

  /**
   * Open Android System Accessibility Settings
   */
  public async openProtectionSettings(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeLocker.openProtectionSettings();
        return;
      } catch (e) {
        console.error('Failed to open native protection settings:', e);
      }
    }
    if (typeof window !== 'undefined') {
      alert('On Android devices, this directly opens Android System Settings > Accessibility > PushLock AI App Protection.');
    }
  }

  /**
   * Workout History
   */
  public getWorkoutHistory(): WorkoutSessionLog[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  }

  public logWorkoutSession(session: WorkoutSessionLog): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getWorkoutHistory();
      history.unshift(session);
      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.error('Failed to log workout:', e);
    }
  }

  public resetAllData(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
      localStorage.removeItem(STORAGE_KEYS.UNLOCK_SESSIONS);
      localStorage.setItem(STORAGE_KEYS.PROTECTED_APPS, JSON.stringify(DEFAULT_DEMO_APPS));
      triggerHaptic('click');
    } catch (e) {
      console.error('Failed to reset data:', e);
    }
  }

  public getProtectionSettings(): AppProtectionSettings {
    if (typeof window === 'undefined') return DEFAULT_PROTECTION_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROTECTION_SETTINGS);
      if (stored) return JSON.parse(stored);
      return DEFAULT_PROTECTION_SETTINGS;
    } catch {
      return DEFAULT_PROTECTION_SETTINGS;
    }
  }

  public saveProtectionSettings(settings: Partial<AppProtectionSettings>): AppProtectionSettings {
    if (typeof window === 'undefined') return DEFAULT_PROTECTION_SETTINGS;
    try {
      const current = this.getProtectionSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.PROTECTION_SETTINGS, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_PROTECTION_SETTINGS;
    }
  }
}

export const androidAppLocker = AndroidAppLockerService.getInstance();
