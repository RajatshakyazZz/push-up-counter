package com.pushlock.ai.blocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray

/**
 * AppBlockerManager
 * Manages blocked packages, screen-time quota seconds earned from push-ups,
 * and permissions (UsageStats & Overlay).
 */
object AppBlockerManager {
    private const val PREFS_NAME = "pushup_app_blocker_prefs"
    private const val KEY_BLOCKED_PACKAGES = "key_blocked_packages"
    private const val KEY_QUOTA_SECONDS = "key_quota_seconds"
    private const val KEY_TOTAL_PUSHUPS = "key_total_pushups"

    private val _remainingQuotaFlow = MutableStateFlow(0L)
    val remainingQuotaFlow = _remainingQuotaFlow.asStateFlow()

    private val _blockedPackagesFlow = MutableStateFlow<Set<String>>(emptySet())
    val blockedPackagesFlow = _blockedPackagesFlow.asStateFlow()

    fun init(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        _remainingQuotaFlow.value = prefs.getLong(KEY_QUOTA_SECONDS, 0L)
        _blockedPackagesFlow.value = prefs.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
    }

    fun getRemainingQuota(context: Context): Long {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getLong(KEY_QUOTA_SECONDS, 0L)
    }

    fun setRemainingQuota(context: Context, seconds: Long) {
        val safeSeconds = maxOf(0L, seconds)
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putLong(KEY_QUOTA_SECONDS, safeSeconds)
            .apply()
        _remainingQuotaFlow.value = safeSeconds
    }

    fun addEarnedTime(context: Context, additionalSeconds: Long) {
        val current = getRemainingQuota(context)
        setRemainingQuota(context, current + additionalSeconds)
    }

    fun decrementQuota(context: Context): Long {
        val current = getRemainingQuota(context)
        val newQuota = maxOf(0L, current - 1L)
        setRemainingQuota(context, newQuota)
        return newQuota
    }

    fun getBlockedPackages(context: Context): Set<String> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()
    }

    fun setBlockedPackages(context: Context, packages: Set<String>) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putStringSet(KEY_BLOCKED_PACKAGES, packages)
            .apply()
        _blockedPackagesFlow.value = packages
    }

    fun toggleAppBlock(context: Context, packageName: String) {
        val current = getBlockedPackages(context).toMutableSet()
        if (current.contains(packageName)) {
            current.remove(packageName)
        } else {
            current.add(packageName)
        }
        setBlockedPackages(context, current)
    }

    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun openUsageStatsSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun hasOverlayPermission(context: Context): Boolean {
        return Settings.canDrawOverlays(context)
    }

    fun openOverlaySettings(context: Context) {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${context.packageName}")
        ).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    fun startBlockService(context: Context) {
        try {
            val intent = Intent(context, com.pushlock.ai.service.AppBlockForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stopBlockService(context: Context) {
        try {
            val intent = Intent(context, com.pushlock.ai.service.AppBlockForegroundService::class.java)
            context.stopService(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
