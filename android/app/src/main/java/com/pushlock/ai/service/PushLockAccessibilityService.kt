package com.pushlock.ai.service

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import com.pushlock.ai.MainActivity
import com.pushlock.ai.plugin.PushLockAppLockerPlugin
import com.pushlock.ai.storage.NativeAppProtectionStore
import java.util.concurrent.ConcurrentHashMap

/**
 * PushLockAccessibilityService
 * Android Accessibility Service for real-time foreground app protection interception.
 * - Enforces canRetrieveWindowContent="false" and isAccessibilityTool="false".
 * - Intercepts TYPE_WINDOW_STATE_CHANGED for protected apps.
 * - Features a continuous foreground expiry timer so apps re-lock immediately upon
 *   timer expiration even if the user never leaves the app.
 */
class PushLockAccessibilityService : AccessibilityService() {

    private lateinit var protectionStore: NativeAppProtectionStore
    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastTriggeredPackage: String? = null
    private var lastTriggerTimestamp: Long = 0

    companion object {
        const val ACTION_LOCK_APP = "com.pushlock.ai.ACTION_LOCK_APP"
        const val EXTRA_LOCKED_PACKAGE = "locked_package_name"
        const val EXTRA_APP_NAME = "locked_app_name"
        const val EXTRA_TARGET_REPS = "locked_target_reps"
        const val EXTRA_UNLOCK_MINUTES = "locked_unlock_minutes"
        const val EXTRA_CATEGORY = "locked_category"
        const val EXTRA_ICON_NAME = "locked_icon_name"
        const val EXTRA_COLOR = "locked_color"

        private const val TRIGGER_COOLDOWN_MS = 1500L

        @Volatile
        var instance: PushLockAccessibilityService? = null
            private set

        @Volatile
        var currentForegroundPackage: String? = null
            private set

        private val expiryRunnables = ConcurrentHashMap<String, Runnable>()

        fun isServiceRunning(): Boolean {
            return instance != null
        }

        /**
         * Schedules a native expiry check for continuous foreground app usage.
         * When the timer fires, if the protected app is still on screen, PushLock is triggered immediately.
         */
        fun scheduleExpiryCheck(packageName: String, unlockUntil: Long) {
            val service = instance ?: return
            service.schedulePackageExpiry(packageName, unlockUntil)
        }

        fun cancelExpiryCheck(packageName: String) {
            val service = instance ?: return
            service.cancelPackageExpiry(packageName)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        protectionStore = NativeAppProtectionStore.getInstance(applicationContext)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        val pkgName = event.packageName?.toString() ?: return
        if (pkgName.isEmpty()) return

        // Exclude self, system UI, launchers, input methods
        if (isIgnoredPackage(pkgName)) {
            return
        }

        currentForegroundPackage = pkgName

        // Check if package is protected and currently locked (expired or un-unlocked)
        if (protectionStore.isAppLocked(pkgName)) {
            checkAndTriggerLock(pkgName)
        }
    }

    private fun checkAndTriggerLock(packageName: String) {
        val now = System.currentTimeMillis()
        // Debounce repeated triggers
        if (packageName == lastTriggeredPackage && (now - lastTriggerTimestamp) < TRIGGER_COOLDOWN_MS) {
            return
        }

        lastTriggeredPackage = packageName
        lastTriggerTimestamp = now

        val appObj = protectionStore.getApp(packageName) ?: return
        val appName = appObj.optString("name", packageName)
        val targetReps = appObj.optInt("targetReps", 20)
        val unlockMinutes = appObj.optInt("unlockMinutes", 15)
        val category = appObj.optString("category", "custom")
        val iconName = appObj.optString("iconName", "shield")
        val color = appObj.optString("color", "#16A34A")

        // 1. Notify active Capacitor Plugin listeners directly if webview is alive
        PushLockAppLockerPlugin.notifyLockTrigger(
            packageName = packageName,
            appName = appName,
            targetReps = targetReps,
            unlockMinutes = unlockMinutes,
            category = category,
            iconName = iconName,
            color = color
        )

        // 2. Bring PushLock MainActivity to the foreground
        val lockIntent = Intent(applicationContext, MainActivity::class.java).apply {
            action = ACTION_LOCK_APP
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra(EXTRA_LOCKED_PACKAGE, packageName)
            putExtra(EXTRA_APP_NAME, appName)
            putExtra(EXTRA_TARGET_REPS, targetReps)
            putExtra(EXTRA_UNLOCK_MINUTES, unlockMinutes)
            putExtra(EXTRA_CATEGORY, category)
            putExtra(EXTRA_ICON_NAME, iconName)
            putExtra(EXTRA_COLOR, color)
        }

        try {
            startActivity(lockIntent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun schedulePackageExpiry(packageName: String, unlockUntil: Long) {
        cancelPackageExpiry(packageName)
        val delayMs = unlockUntil - System.currentTimeMillis()
        if (delayMs <= 0) {
            // Already expired
            if (currentForegroundPackage == packageName) {
                checkAndTriggerLock(packageName)
            }
            return
        }

        val runnable = Runnable {
            expiryRunnables.remove(packageName)
            // If user is currently inside the protected app when the timer expires, trigger lock screen!
            if (currentForegroundPackage == packageName && protectionStore.isAppLocked(packageName)) {
                checkAndTriggerLock(packageName)
            }
        }

        expiryRunnables[packageName] = runnable
        mainHandler.postDelayed(runnable, delayMs)
    }

    fun cancelPackageExpiry(packageName: String) {
        val runnable = expiryRunnables.remove(packageName)
        if (runnable != null) {
            mainHandler.removeCallbacks(runnable)
        }
    }

    override fun onInterrupt() {
        // Service interrupted
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        for ((_, runnable) in expiryRunnables) {
            mainHandler.removeCallbacks(runnable)
        }
        expiryRunnables.clear()
    }

    private fun isIgnoredPackage(packageName: String): Boolean {
        val self = applicationContext.packageName
        if (packageName == self) return true

        return packageName.startsWith("com.android.systemui") ||
               packageName.startsWith("com.google.android.inputmethod") ||
               packageName.startsWith("android") ||
               packageName.startsWith("com.android.settings") ||
               packageName.startsWith("com.google.android.packageinstaller") ||
               packageName.startsWith("com.android.packageinstaller") ||
               packageName.contains("launcher")
    }
}
