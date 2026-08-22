package com.pushlock.ai.service

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import com.pushlock.ai.MainActivity
import com.pushlock.ai.notification.PushLockNotificationManager
import com.pushlock.ai.plugin.PushLockAppLockerPlugin
import com.pushlock.ai.storage.NativeAppProtectionStore

/**
 * PushLockAccessibilityService
 * Android Accessibility Service for real-time foreground app protection interception
 * and active screen-time countdown deduction.
 *
 * Key Features:
 * - canRetrieveWindowContent="false" & isAccessibilityTool="false" (Privacy-first).
 * - Active screen-time deduction: countdown runs ONLY when the user is actively inside the unlocked app.
 * - Pauses countdown when user exits to home screen, switches apps, or locks the phone.
 * - Instant lock when countdown reaches 00:00.
 */
class PushLockAccessibilityService : AccessibilityService() {

    private lateinit var protectionStore: NativeAppProtectionStore
    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastTriggeredPackage: String? = null
    private var lastTriggerTimestamp: Long = 0

    // Active screen-time tracking
    @Volatile
    private var activeDeductionPackage: String? = null
    private var activeTickerRunnable: Runnable? = null

    private val screenOffReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == Intent.ACTION_SCREEN_OFF) {
                pauseActiveScreenTimeDeduction()
            }
        }
    }

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

        fun isServiceRunning(): Boolean {
            return instance != null
        }

        fun onAppUnlocked(packageName: String) {
            val service = instance ?: return
            if (currentForegroundPackage == packageName) {
                service.startActiveScreenTimeDeduction(packageName)
            }
        }

        fun onAppManuallyLocked(packageName: String) {
            val service = instance ?: return
            service.stopActiveScreenTimeDeduction(packageName)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        protectionStore = NativeAppProtectionStore.getInstance(applicationContext)

        val filter = IntentFilter(Intent.ACTION_SCREEN_OFF)
        try {
            registerReceiver(screenOffReceiver, filter)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }

        val pkgName = event.packageName?.toString() ?: return
        if (pkgName.isEmpty()) return

        // Exclude system UI, keyboards, etc.
        if (isIgnoredPackage(pkgName)) {
            return
        }

        currentForegroundPackage = pkgName

        // Check if the foreground app is a protected app
        val appObj = protectionStore.getApp(pkgName)
        val isProtected = appObj?.optBoolean("isProtected", false) ?: false

        if (isProtected) {
            val remainingSec = protectionStore.getRemainingScreenTimeSeconds(pkgName)
            if (remainingSec <= 0L) {
                // App is protected and locked (0 screen time)
                pauseActiveScreenTimeDeduction()
                checkAndTriggerLock(pkgName)
            } else {
                // App is protected and currently unlocked with remaining screen time!
                startActiveScreenTimeDeduction(pkgName)
            }
        } else {
            // User switched to an unprotected app or launcher
            pauseActiveScreenTimeDeduction()
        }
    }

    private fun startActiveScreenTimeDeduction(packageName: String) {
        if (activeDeductionPackage == packageName && activeTickerRunnable != null) {
            return // Already tracking this package
        }

        pauseActiveScreenTimeDeduction()
        activeDeductionPackage = packageName

        val appObj = protectionStore.getApp(packageName) ?: return
        val appName = appObj.optString("name", packageName)

        val ticker = object : Runnable {
            override fun run() {
                if (activeDeductionPackage != packageName || currentForegroundPackage != packageName) {
                    return
                }

                val remaining = protectionStore.deductScreenTime(packageName, 1L)

                if (remaining > 0L) {
                    // Update live notification in status bar
                    PushLockNotificationManager.showSessionCountdown(
                        applicationContext,
                        packageName,
                        appName,
                        remaining,
                        isPaused = false
                    )
                    mainHandler.postDelayed(this, 1000L)
                } else {
                    // Time is up! Lock immediately!
                    stopActiveScreenTimeDeduction(packageName)
                    PushLockNotificationManager.showExpiredNotification(applicationContext, appName)
                    checkAndTriggerLock(packageName)
                }
            }
        }

        activeTickerRunnable = ticker
        val initialRemaining = protectionStore.getRemainingScreenTimeSeconds(packageName)
        PushLockNotificationManager.showSessionCountdown(
            applicationContext,
            packageName,
            appName,
            initialRemaining,
            isPaused = false
        )
        mainHandler.postDelayed(ticker, 1000L)
    }

    private fun pauseActiveScreenTimeDeduction() {
        val currentPackage = activeDeductionPackage ?: return
        activeTickerRunnable?.let { mainHandler.removeCallbacks(it) }
        activeTickerRunnable = null

        val appObj = protectionStore.getApp(currentPackage)
        val appName = appObj?.optString("name", currentPackage) ?: currentPackage
        val remaining = protectionStore.getRemainingScreenTimeSeconds(currentPackage)

        if (remaining > 0L) {
            PushLockNotificationManager.showSessionCountdown(
                applicationContext,
                currentPackage,
                appName,
                remaining,
                isPaused = true
            )
        } else {
            PushLockNotificationManager.cancelNotification(applicationContext)
        }
        activeDeductionPackage = null
    }

    private fun stopActiveScreenTimeDeduction(packageName: String) {
        activeTickerRunnable?.let { mainHandler.removeCallbacks(it) }
        activeTickerRunnable = null
        activeDeductionPackage = null
        PushLockNotificationManager.cancelNotification(applicationContext)
    }

    private fun checkAndTriggerLock(packageName: String) {
        val now = System.currentTimeMillis()
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

        PushLockAppLockerPlugin.notifyLockTrigger(
            packageName = packageName,
            appName = appName,
            targetReps = targetReps,
            unlockMinutes = unlockMinutes,
            category = category,
            iconName = iconName,
            color = color
        )

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

    override fun onInterrupt() {
        pauseActiveScreenTimeDeduction()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        pauseActiveScreenTimeDeduction()
        try {
            unregisterReceiver(screenOffReceiver)
        } catch (e: Exception) {
            e.printStackTrace()
        }
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
