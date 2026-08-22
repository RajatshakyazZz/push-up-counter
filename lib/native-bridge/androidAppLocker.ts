import { registerPlugin, Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  InstalledApp,
  ProtectedApp,
  UnlockSession,
  WorkoutSessionLog,
  AppProtectionSettings,
  PermissionCheckResult,
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
    rewardSecondsPerRep?: number;
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
  checkAllPermissions(): Promise<PermissionCheckResult>;
  requestCameraPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<{ granted?: boolean; success?: boolean }>;
  requestBatteryOptimization(): Promise<{ granted?: boolean; success?: boolean }>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  openProtectionSettings(): Promise<{ success: boolean }>;
  openAutoStartSettings(): Promise<{ success: boolean }>;
  isProtectionServiceEnabled(): Promise<{ enabled: boolean; serviceRunning: boolean; settingsEnabled: boolean }>;
  launchApp(options: { packageName: string }): Promise<{ success: boolean }>;
  getPendingLockTrigger(): Promise<{ hasTrigger: boolean; lockTrigger?: ProtectedApp }>;
  addListener(
    eventName: 'appLockTriggered',
    listenerFunc: (data: ProtectedApp) => void
  ): Promise<PluginListenerHandle>;
}

// Register native Capacitor plugin
const NativeLocker = registerPlugin<PushLockAppLockerPluginInterface>('PushLockAppLocker');

export const DEFAULT_PROTECTION_SETTINGS: AppProtectionSettings = {
  defaultUnlockMinutes: 15,
  defaultPushUpTarget: 20,
  rewardSecondsPerRep: 60, // 1 push-up = 1 minute
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
  ONBOARDING_COMPLETED: 'pushlock_onboarding_completed',
};

type LockTriggerListener = (app: ProtectedApp) => void;

/**
 * Android Native App Locker Bridge Service
 * Connects React UI to the Kotlin Native App Locker when running on Android.
 * Returns empty/honest states without mock dummy apps.
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
   * Check all real Android permissions
   */
  public async checkAllPermissions(): Promise<PermissionCheckResult> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.checkAllPermissions();
        if (res) return res;
      } catch (e) {
        console.error('Failed to query native permissions:', e);
      }
    }

    let cameraGranted = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
        cameraGranted = status.state === 'granted';
      }
    } catch {
      // Permission query not supported on all browsers
    }

    return {
      camera: cameraGranted,
      overlay: true,
      accessibility: true,
      batteryOptimization: true,
      notification: true,
      isOemRequiringAutoStart: false,
      manufacturer: 'Browser Preview',
      allRequiredGranted: cameraGranted,
    };
  }

  /**
   * Request Android Battery Optimization Exemption
   */
  public async requestBatteryOptimization(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeLocker.requestBatteryOptimization();
        return;
      } catch (e) {
        console.error('Failed to request battery optimization:', e);
      }
    }
  }

  /**
   * Request Android 13+ Notification Permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.requestNotificationPermission();
        return !!res?.granted;
      } catch (e) {
        console.error('Failed to request notification permission:', e);
      }
    }
    return true;
  }

  /**
   * Request real Android Camera permission or WebRTC camera stream
   */
  public async requestCameraPermission(): Promise<boolean> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.requestCameraPermission();
        if (res?.granted) {
          return true;
        }
      } catch (e) {
        console.error('Native camera permission request failed:', e);
      }
    }

    // Always attempt getUserMedia to prompt webview / browser permission dialog
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      }
    } catch (err) {
      console.warn('Web camera stream request failed or denied:', err);
    }
    return false;
  }

  /**
   * Request real Android Display Over Other Apps (SYSTEM_ALERT_WINDOW)
   */
  public async requestOverlayPermission(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeLocker.requestOverlayPermission();
        return;
      } catch (e) {
        console.error('Native overlay permission request failed:', e);
      }
    }
    if (typeof window !== 'undefined') {
      alert('On Android devices, this opens Android System Settings > Display over other apps > PushLock AI.');
    }
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
   * Open Manufacturer AutoStart settings (Xiaomi, Samsung, Oppo, etc.)
   */
  public async openAutoStartSettings(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeLocker.openAutoStartSettings();
        return;
      } catch (e) {
        console.error('Failed to open native AutoStart settings:', e);
      }
    }
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
    return true;
  }

  /**
   * Queries real installed launchable apps on Android.
   */
  public async getInstalledApps(): Promise<InstalledApp[]> {
    if (this.isNative) {
      try {
        const res = await NativeLocker.getInstalledApps({ includeIcons: true });
        if (res?.apps?.length > 0) {
          // Cache in localStorage for fast startup
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

    return [];
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
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROTECTED_APPS);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
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
   * Protect an app with rep target, unlock duration, and reward rate
   */
  public async protectApp(
    packageName: string,
    appName: string,
    targetReps: number,
    unlockMinutes: number,
    rewardSecondsPerRep: number = 60,
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
          rewardSecondsPerRep,
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

    // Local Web storage
    const apps = this.getProtectedApps();
    const existingIndex = apps.findIndex((a) => a.packageName === packageName);
    let updatedApp: ProtectedApp;

    if (existingIndex >= 0) {
      updatedApp = {
        ...apps[existingIndex],
        name: appName,
        targetReps,
        unlockMinutes,
        rewardSecondsPerRep,
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
        rewardSecondsPerRep,
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
      localStorage.removeItem(STORAGE_KEYS.PROTECTED_APPS);
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

  public isOnboardingCompleted(): boolean {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    } catch {
      return false;
    }
  }

  public setOnboardingCompleted(completed: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  }
}

export const androidAppLocker = AndroidAppLockerService.getInstance();
