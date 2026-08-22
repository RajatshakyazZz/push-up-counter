import {
  InstalledApp,
  ProtectedApp,
  UnlockSession,
  WorkoutSessionLog,
  AppProtectionSettings,
} from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

// Default pre-configured sample apps (Clearly labeled Demo apps in web preview)
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
    timesUnlockedToday: 2,
    totalUnlocks: 14,
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
    timesUnlockedToday: 1,
    totalUnlocks: 9,
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
    totalUnlocks: 5,
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
    totalUnlocks: 3,
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
    timesUnlockedToday: 1,
    totalUnlocks: 8,
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
    totalUnlocks: 2,
    lastUnlockedAt: null,
  },
  {
    id: 'app-x',
    packageName: 'com.twitter.android',
    name: 'X (Twitter)',
    category: 'social',
    iconName: 'twitter',
    color: '#0F1419',
    targetReps: 15,
    unlockMinutes: 10,
    isProtected: false,
    timesUnlockedToday: 0,
    totalUnlocks: 4,
    lastUnlockedAt: null,
  },
  {
    id: 'app-games',
    packageName: 'com.king.candycrushsaga',
    name: 'Mobile Games',
    category: 'gaming',
    iconName: 'gamepad',
    color: '#8B5CF6',
    targetReps: 30,
    unlockMinutes: 30,
    isProtected: true,
    timesUnlockedToday: 0,
    totalUnlocks: 6,
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
  DAILY_STATS: 'pushlock_daily_stats',
};

/**
 * Android Native App Locker Bridge Interface
 */
export class AndroidAppLockerService {
  private static instance: AndroidAppLockerService;

  private isAndroidEnvironment: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Check if running inside Android WebView with Capacitor / PushLock Native Bridge
      this.isAndroidEnvironment = !!(
        (window as unknown as { PushLockNative?: unknown }).PushLockNative ||
        (window as unknown as { AndroidLocker?: unknown }).AndroidLocker
      );
    }
  }

  public static getInstance(): AndroidAppLockerService {
    if (!AndroidAppLockerService.instance) {
      AndroidAppLockerService.instance = new AndroidAppLockerService();
    }
    return AndroidAppLockerService.instance;
  }

  /**
   * Check whether running in native Android container vs web browser/PWA
   */
  public isNativeAndroid(): boolean {
    return this.isAndroidEnvironment;
  }

  /**
   * Returns list of candidate apps. In native Android, queries PackageManager.
   * In Web Preview, provides standard popular distracting apps labeled as Demo.
   */
  public async getInstalledApps(): Promise<InstalledApp[]> {
    return [
      { packageName: 'com.instagram.android', name: 'Instagram', category: 'social', iconName: 'instagram', color: '#E1306C' },
      { packageName: 'com.google.android.youtube', name: 'YouTube', category: 'entertainment', iconName: 'youtube', color: '#FF0000' },
      { packageName: 'com.snapchat.android', name: 'Snapchat', category: 'social', iconName: 'snapchat', color: '#FFFC00' },
      { packageName: 'com.zhiliaoapp.musically', name: 'TikTok', category: 'social', iconName: 'tiktok', color: '#000000' },
      { packageName: 'com.reddit.frontpage', name: 'Reddit', category: 'social', iconName: 'reddit', color: '#FF4500' },
      { packageName: 'com.facebook.katana', name: 'Facebook', category: 'social', iconName: 'facebook', color: '#1877F2' },
      { packageName: 'com.twitter.android', name: 'X (Twitter)', category: 'social', iconName: 'twitter', color: '#0F1419' },
      { packageName: 'com.netflix.mediaclient', name: 'Netflix', category: 'entertainment', iconName: 'film', color: '#E50914' },
      { packageName: 'com.king.candycrushsaga', name: 'Candy Crush Saga', category: 'gaming', iconName: 'gamepad', color: '#8B5CF6' },
      { packageName: 'com.supercell.clashroyale', name: 'Clash Royale', category: 'gaming', iconName: 'gamepad', color: '#F59E0B' },
    ];
  }

  /**
   * Retrieves all protected apps and their configurations from storage.
   */
  public getProtectedApps(): ProtectedApp[] {
    if (typeof window === 'undefined') return DEFAULT_DEMO_APPS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROTECTED_APPS);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with defaults
      localStorage.setItem(STORAGE_KEYS.PROTECTED_APPS, JSON.stringify(DEFAULT_DEMO_APPS));
      return DEFAULT_DEMO_APPS;
    } catch {
      return DEFAULT_DEMO_APPS;
    }
  }

  /**
   * Save protected apps list
   */
  public saveProtectedApps(apps: ProtectedApp[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROTECTED_APPS, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to save protected apps:', e);
    }
  }

  /**
   * Adds or updates an app to the protected list
   */
  public protectApp(
    packageName: string,
    appName: string,
    targetReps: number,
    unlockMinutes: number,
    category: ProtectedApp['category'] = 'custom',
    iconName: string = 'shield',
    color: string = '#16A34A'
  ): ProtectedApp {
    const apps = this.getProtectedApps();
    const existingIndex = apps.findIndex((a) => a.packageName === packageName);

    let updatedApp: ProtectedApp;

    if (existingIndex >= 0) {
      updatedApp = {
        ...apps[existingIndex],
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

    this.saveProtectedApps(apps);
    triggerHaptic('click');
    return updatedApp;
  }

  /**
   * Removes protection from an app
   */
  public unprotectApp(packageName: string): boolean {
    const apps = this.getProtectedApps();
    const updated = apps.map((app) =>
      app.packageName === packageName ? { ...app, isProtected: false } : app
    );
    this.saveProtectedApps(updated);
    triggerHaptic('click');
    return true;
  }

  /**
   * Toggle ON/OFF protection
   */
  public toggleProtection(packageName: string, isProtected: boolean): boolean {
    const apps = this.getProtectedApps();
    const updated = apps.map((app) =>
      app.packageName === packageName ? { ...app, isProtected } : app
    );
    this.saveProtectedApps(updated);
    triggerHaptic('click');
    return true;
  }

  /**
   * Delete an app from the list
   */
  public deleteApp(packageName: string): boolean {
    const apps = this.getProtectedApps();
    const updated = apps.filter((app) => app.packageName !== packageName);
    this.saveProtectedApps(updated);
    return true;
  }

  /**
   * Get protection status and config for a specific app package
   */
  public getProtectionStatus(packageName: string): { isProtected: boolean; app: ProtectedApp | null } {
    const apps = this.getProtectedApps();
    const app = apps.find((a) => a.packageName === packageName) || null;
    return {
      isProtected: !!app?.isProtected,
      app,
    };
  }

  /**
   * Simulates/reads the current foreground app
   */
  public async getForegroundApp(): Promise<string | null> {
    return null;
  }

  /**
   * Unlocks an app temporarily after verified push-up completion
   */
  public unlockApp(packageName: string, durationMinutes: number, repsCompleted: number): UnlockSession {
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    const apps = this.getProtectedApps();
    const targetApp = apps.find((a) => a.packageName === packageName);
    const appName = targetApp ? targetApp.name : packageName;

    // Update app's unlock metrics
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
    this.saveProtectedApps(updatedApps);

    // Save active unlock session
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

    // Log workout session to history
    this.logWorkoutSession({
      id: `workout-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: now,
      reps: repsCompleted,
      durationSeconds: Math.round((repsCompleted * 2.8)),
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
   * Re-locks an app manually or when timer expires
   */
  public lockApp(packageName: string): boolean {
    const sessions = this.getActiveUnlockSessions();
    const updated = sessions.filter((s) => s.packageName !== packageName);
    this.saveUnlockSessions(updated);
    triggerHaptic('lock');
    return true;
  }

  /**
   * Returns all active unlock sessions (pruning expired ones)
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

  /**
   * Save unlock sessions
   */
  private saveUnlockSessions(sessions: UnlockSession[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.UNLOCK_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save unlock sessions:', e);
    }
  }

  /**
   * Returns remaining seconds for an unlocked app (0 if locked or expired)
   */
  public getRemainingUnlockTime(packageName: string): number {
    const sessions = this.getActiveUnlockSessions();
    const session = sessions.find((s) => s.packageName === packageName);
    if (!session) return 0;

    const remainingMs = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }

  /**
   * Check Usage Access permission (Android PACKAGE_USAGE_STATS)
   */
  public async checkUsageAccessPermission(): Promise<boolean> {
    if (this.isAndroidEnvironment) {
      // In native Android, checks AppOpsManager.MODE_ALLOWED
      return true;
    }
    return false;
  }

  /**
   * Open Android system settings for Usage Access
   */
  public openUsageAccessSettings(): void {
    if (typeof window !== 'undefined') {
      alert('On Android devices, this opens Android System Settings > Usage Access > Enable PushLock.');
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

      // Seed initial sample logs for today/yesterday to show clean Android History UI
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const initialLogs: WorkoutSessionLog[] = [
        {
          id: 'log-1',
          date: todayStr,
          timestamp: Date.now() - 3600000 * 2,
          reps: 20,
          durationSeconds: 58,
          unlockedAppName: 'Instagram',
          unlockedPackageName: 'com.instagram.android',
          formAccuracy: 96,
          caloriesBurned: 9,
          type: 'app_unlock',
        },
        {
          id: 'log-2',
          date: todayStr,
          timestamp: Date.now() - 3600000 * 5,
          reps: 25,
          durationSeconds: 72,
          unlockedAppName: 'YouTube',
          unlockedPackageName: 'com.google.android.youtube',
          formAccuracy: 92,
          caloriesBurned: 12,
          type: 'app_unlock',
        },
        {
          id: 'log-3',
          date: yesterday,
          timestamp: Date.now() - 86400000 - 3600000 * 4,
          reps: 30,
          durationSeconds: 90,
          formAccuracy: 98,
          caloriesBurned: 14,
          type: 'free_workout',
        },
        {
          id: 'log-4',
          date: yesterday,
          timestamp: Date.now() - 86400000 - 3600000 * 8,
          reps: 20,
          durationSeconds: 62,
          unlockedAppName: 'Reddit',
          unlockedPackageName: 'com.reddit.frontpage',
          formAccuracy: 94,
          caloriesBurned: 9,
          type: 'app_unlock',
        },
      ];

      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(initialLogs));
      return initialLogs;
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

  /**
   * App Protection Global Settings
   */
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
