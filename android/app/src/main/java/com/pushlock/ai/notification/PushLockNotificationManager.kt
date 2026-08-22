package com.pushlock.ai.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.pushlock.ai.MainActivity
import com.pushlock.ai.R

/**
 * PushLockNotificationManager
 * Manages native real-time status bar notifications showing active screen time countdown
 * and auto-lock alerts.
 */
object PushLockNotificationManager {

    const val CHANNEL_ID_ACTIVE_SESSION = "pushlock_screen_time_countdown"
    const val CHANNEL_NAME_ACTIVE_SESSION = "PushLock Active Screen Time"
    const val NOTIFICATION_ID_ACTIVE_SESSION = 1001

    const val ACTION_LOCK_NOW = "com.pushlock.ai.ACTION_LOCK_NOW"
    const val EXTRA_PACKAGE_TO_LOCK = "package_to_lock"

    private fun ensureNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

            val channel = NotificationChannel(
                CHANNEL_ID_ACTIVE_SESSION,
                CHANNEL_NAME_ACTIVE_SESSION,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows real-time countdown timer for unlocked apps earned with push-ups"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun formatTime(seconds: Long): String {
        val mins = seconds / 60
        val secs = seconds % 60
        return if (mins > 0) {
            String.format("%d min %02d sec", mins, secs)
        } else {
            String.format("%d seconds", secs)
        }
    }

    /**
     * Updates or shows the persistent status bar notification with real-time active countdown.
     */
    fun showSessionCountdown(
        context: Context,
        packageName: String,
        appName: String,
        remainingSeconds: Long,
        isPaused: Boolean = false
    ) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        ensureNotificationChannel(context)

        if (remainingSeconds <= 0) {
            cancelNotification(context)
            return
        }

        val formattedTime = formatTime(remainingSeconds)

        // Tap notification to open PushLock AI
        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            context,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        // Lock Now action button in notification
        val lockIntent = Intent(context, MainActivity::class.java).apply {
            action = ACTION_LOCK_NOW
            putExtra(EXTRA_PACKAGE_TO_LOCK, packageName)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingLock = PendingIntent.getActivity(
            context,
            packageName.hashCode(),
            lockIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val title = if (isPaused) {
            "⏸️ $appName Paused"
        } else {
            "⏳ $appName: $formattedTime"
        }

        val contentText = if (isPaused) {
            "$formattedTime screen time remaining (Timer resumed when opened)"
        } else {
            "Active screen time earned with verified push-ups"
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID_ACTIVE_SESSION)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(contentText)
            .setContentIntent(pendingOpenApp)
            .setOngoing(!isPaused)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .addAction(
                android.R.drawable.ic_lock_lock,
                "Lock Now",
                pendingLock
            )

        notificationManager.notify(NOTIFICATION_ID_ACTIVE_SESSION, builder.build())
    }

    /**
     * Cancels the active countdown notification.
     */
    fun cancelNotification(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        notificationManager.cancel(NOTIFICATION_ID_ACTIVE_SESSION)
    }

    /**
     * Shows a brief notification when screen time has expired and app is locked again.
     */
    fun showExpiredNotification(context: Context, appName: String) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        ensureNotificationChannel(context)

        val openAppIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpenApp = PendingIntent.getActivity(
            context,
            1,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID_ACTIVE_SESSION)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🔒 Time Expired: $appName Locked")
            .setContentText("Do push-ups on PushLock AI to earn more screen time!")
            .setContentIntent(pendingOpenApp)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        notificationManager.notify(NOTIFICATION_ID_ACTIVE_SESSION + 1, builder.build())
    }
}
