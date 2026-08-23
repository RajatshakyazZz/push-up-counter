package com.pushlock.ai.service

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.pushlock.ai.MainActivity
import com.pushlock.ai.R
import com.pushlock.ai.blocker.AppBlockerManager
import com.pushlock.ai.notification.PushLockNotificationManager
import com.pushlock.ai.plugin.PushLockAppLockerPlugin
import com.pushlock.ai.storage.NativeAppProtectionStore
import kotlinx.coroutines.*
import java.util.Locale

class AppBlockForegroundService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.Default + Job())
    private var monitoringJob: Job? = null
    private lateinit var notificationManager: NotificationManager

    companion object {
        const val CHANNEL_ID = "app_block_countdown_channel"
        const val NOTIFICATION_ID = 1001
    }

    override fun onCreate() {
        super.onCreate()
        AppBlockerManager.init(this)
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val initialNotification = buildCountdownNotification(
            remainingSeconds = AppBlockerManager.getRemainingQuota(this),
            isActiveInBlockedApp = false,
            currentAppName = null
        )
        startForeground(NOTIFICATION_ID, initialNotification)
        startMonitoringLoop()
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Time Countdown",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Displays remaining earned screen time"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun startMonitoringLoop() {
        monitoringJob?.cancel()
        monitoringJob = serviceScope.launch {
            var lastActivePackage: String? = null
            var tickCounter = 0

            while (isActive) {
                try {
                    val currentForegroundApp = getTopForegroundPackage()
                    val blockedPackages = AppBlockerManager.getBlockedPackages(applicationContext)
                    val isCurrentAppBlocked = currentForegroundApp != null &&
                            blockedPackages.contains(currentForegroundApp) &&
                            currentForegroundApp != packageName
                    val store = NativeAppProtectionStore.getInstance(applicationContext)
                    val remainingSeconds = if (currentForegroundApp != null) {
                        store.getRemainingScreenTimeSeconds(currentForegroundApp)
                    } else {
                        AppBlockerManager.getRemainingQuota(applicationContext)
                    }

                    if (isCurrentAppBlocked) {
                        val currentAppName = getAppName(currentForegroundApp!!)
                        if (remainingSeconds <= 0) {
                            launchBlockedAppOverlay(currentForegroundApp)
                            updateNotification(0L, isActiveInBlockedApp = true, currentAppName = currentAppName)
                        } else {
                            val updatedRemaining = store.deductScreenTime(currentForegroundApp, 1L)
                            AppBlockerManager.setRemainingQuota(applicationContext, updatedRemaining)
                            updateNotification(updatedRemaining, isActiveInBlockedApp = true, currentAppName = currentAppName)

                            if (updatedRemaining <= 0) {
                                launchBlockedAppOverlay(currentForegroundApp)
                            }
                        }
                    } else {
                        if (tickCounter % 3 == 0 || lastActivePackage != currentForegroundApp) {
                            val globalQuota = AppBlockerManager.getRemainingQuota(applicationContext)
                            updateNotification(globalQuota, isActiveInBlockedApp = false, currentAppName = null)
                        }
                    }

                    lastActivePackage = currentForegroundApp
                    tickCounter++
                    delay(1000L)
                } catch (e: Exception) {
                    Log.e("AppBlockService", "Error in monitor loop: ${e.message}")
                    delay(2000L)
                }
            }
        }
    }

    private fun getTopForegroundPackage(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return null

        val endTime = System.currentTimeMillis()
        val startTime = endTime - 10000L

        val events = usageStatsManager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        var lastForegroundApp: String? = null

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                lastForegroundApp = event.packageName
            }
        }
        return lastForegroundApp
    }

    private fun getAppName(packageName: String): String {
        return try {
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName
        }
    }

    private fun launchBlockedAppOverlay(blockedPackage: String) {
        val appName = getAppName(blockedPackage)
        val store = NativeAppProtectionStore.getInstance(this)
        val appConfig = store.getApp(blockedPackage)
        val targetReps = appConfig?.optInt("targetReps", 20) ?: 20
        val unlockMinutes = appConfig?.optInt("unlockMinutes", 15) ?: 15
        val category = appConfig?.optString("category", "social") ?: "social"
        val iconName = appConfig?.optString("iconName", "shield") ?: "shield"
        val color = appConfig?.optString("color", "#16A34A") ?: "#16A34A"

        PushLockAppLockerPlugin.notifyLockTrigger(
            blockedPackage,
            appName,
            targetReps,
            unlockMinutes,
            category,
            iconName,
            color
        )

        val intent = Intent(this, MainActivity::class.java).apply {
            action = PushLockAccessibilityService.ACTION_LOCK_APP
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(PushLockAccessibilityService.EXTRA_LOCKED_PACKAGE, blockedPackage)
            putExtra(PushLockAccessibilityService.EXTRA_APP_NAME, appName)
            putExtra(PushLockAccessibilityService.EXTRA_TARGET_REPS, targetReps)
            putExtra(PushLockAccessibilityService.EXTRA_UNLOCK_MINUTES, unlockMinutes)
            putExtra(PushLockAccessibilityService.EXTRA_CATEGORY, category)
            putExtra(PushLockAccessibilityService.EXTRA_ICON_NAME, iconName)
            putExtra(PushLockAccessibilityService.EXTRA_COLOR, color)
        }
        startActivity(intent)
    }

    private fun updateNotification(remainingSeconds: Long, isActiveInBlockedApp: Boolean, currentAppName: String?) {
        val notification = buildCountdownNotification(remainingSeconds, isActiveInBlockedApp, currentAppName)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun buildCountdownNotification(
        remainingSeconds: Long,
        isActiveInBlockedApp: Boolean,
        currentAppName: String?
    ): Notification {
        val minutes = remainingSeconds / 60
        val seconds = remainingSeconds % 60
        val formattedTime = String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)

        val title = if (isActiveInBlockedApp) {
            val appLabel = if (currentAppName != null) "$currentAppName Running" else "Screen Time Running"
            "⏳ $appLabel: $formattedTime"
        } else if (remainingSeconds > 0) {
            "Available Screen Time: $formattedTime"
        } else {
            "🔒 Screen Time Expired (00:00)"
        }

        val contentText = if (remainingSeconds > 0) {
            if (isActiveInBlockedApp) "Blocked app in use. Time is ticking down." else "Earned time is paused."
        } else {
            "Do push-ups to earn more screen time!"
        }

        val workoutIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(PushLockNotificationManager.EXTRA_NAVIGATE_TO, "WORKOUT")
        }
        val pendingWorkoutIntent = PendingIntent.getActivity(
            this,
            0,
            workoutIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val lockNowIntent = Intent(this, MainActivity::class.java).apply {
            action = PushLockNotificationManager.ACTION_LOCK_NOW
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingLockNowIntent = PendingIntent.getActivity(
            this,
            1,
            lockNowIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val iconRes = android.R.drawable.ic_lock_idle_lock

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(contentText)
            .setSmallIcon(iconRes)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setColor(if (isActiveInBlockedApp) AndroidColor.GREEN else AndroidColor.CYAN)
            .setContentIntent(pendingWorkoutIntent)
            .addAction(
                android.R.drawable.ic_media_play,
                "🔥 Earn Time (+Pushups)",
                pendingWorkoutIntent
            )
            .addAction(
                android.R.drawable.ic_lock_power_off,
                "🔒 Lock Now",
                pendingLockNowIntent
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        monitoringJob?.cancel()
        serviceScope.cancel()
        super.onDestroy()
    }
}
