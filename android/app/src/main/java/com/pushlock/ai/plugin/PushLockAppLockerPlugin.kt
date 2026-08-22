package com.pushlock.ai.plugin

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.pushlock.ai.inventory.AppInventoryManager
import com.pushlock.ai.service.PushLockAccessibilityService
import com.pushlock.ai.storage.NativeAppProtectionStore
import org.json.JSONObject

/**
 * PushLockAppLockerPlugin
 * Native Capacitor Plugin for PushLock AI.
 * Bridges React UI to native Android app inventory, protection storage,
 * and accessibility service app interception.
 */
@CapacitorPlugin(name = "PushLockAppLocker")
class PushLockAppLockerPlugin : Plugin() {

    private lateinit var protectionStore: NativeAppProtectionStore
    private lateinit var inventoryManager: AppInventoryManager

    companion object {
        @Volatile
        private var activeInstance: PushLockAppLockerPlugin? = null

        @Volatile
        var pendingLockTrigger: JSObject? = null

        fun notifyLockTrigger(
            packageName: String,
            appName: String,
            targetReps: Int,
            unlockMinutes: Int,
            category: String,
            iconName: String,
            color: String
        ) {
            val payload = JSObject().apply {
                put("packageName", packageName)
                put("name", appName)
                put("targetReps", targetReps)
                put("unlockMinutes", unlockMinutes)
                put("category", category)
                put("iconName", iconName)
                put("color", color)
                put("timestamp", System.currentTimeMillis())
            }

            pendingLockTrigger = payload

            activeInstance?.let { plugin ->
                plugin.notifyListeners("appLockTriggered", payload)
            }
        }
    }

    override fun load() {
        super.load()
        activeInstance = this
        protectionStore = NativeAppProtectionStore.getInstance(context)
        inventoryManager = AppInventoryManager(context)
    }

    @PluginMethod
    fun getInstalledApps(call: PluginCall) {
        try {
            val includeIcons = call.getBoolean("includeIcons", true) ?: true
            val apps = inventoryManager.getInstalledApps(includeIcons)
            val jsArray = JSArray()
            for (app in apps) {
                jsArray.put(JSObject(app.toString()))
            }
            val ret = JSObject().apply {
                put("apps", jsArray)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get installed apps: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getProtectedApps(call: PluginCall) {
        try {
            val apps = protectionStore.getAllProtectedApps()
            val jsArray = JSArray()
            for (app in apps) {
                jsArray.put(JSObject(app.toString()))
            }
            val ret = JSObject().apply {
                put("apps", jsArray)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get protected apps: ${e.message}", e)
        }
    }

    @PluginMethod
    fun protectApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        val appName = call.getString("name", packageName) ?: packageName
        val targetReps = call.getInt("targetReps", 20) ?: 20
        val unlockMinutes = call.getInt("unlockMinutes", 15) ?: 15
        val category = call.getString("category", "custom") ?: "custom"
        val iconName = call.getString("iconName", "shield") ?: "shield"
        val color = call.getString("color", "#16A34A") ?: "#16A34A"

        try {
            val updated = protectionStore.protectApp(
                packageName = packageName,
                appName = appName,
                targetReps = targetReps,
                unlockMinutes = unlockMinutes,
                category = category,
                iconName = iconName,
                color = color
            )
            call.resolve(JSObject(updated.toString()))
        } catch (e: Exception) {
            call.reject("Failed to protect app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun unprotectApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val success = protectionStore.unprotectApp(packageName)
            val ret = JSObject().apply { put("success", success) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to unprotect app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun toggleProtection(call: PluginCall) {
        val packageName = call.getString("packageName")
        val isProtected = call.getBoolean("isProtected", true) ?: true

        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val success = protectionStore.toggleProtection(packageName, isProtected)
            val ret = JSObject().apply { put("success", success) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to toggle protection: ${e.message}", e)
        }
    }

    @PluginMethod
    fun deleteApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val success = protectionStore.deleteApp(packageName)
            val ret = JSObject().apply { put("success", success) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to delete app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getProtectionStatus(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val appObj = protectionStore.getApp(packageName)
            val isProtected = appObj?.optBoolean("isProtected", false) ?: false
            val isLocked = protectionStore.isAppLocked(packageName)
            val remainingSeconds = protectionStore.getRemainingUnlockSeconds(packageName)

            val ret = JSObject().apply {
                put("isProtected", isProtected)
                put("isLocked", isLocked)
                put("remainingSeconds", remainingSeconds)
                if (appObj != null) {
                    put("app", JSObject(appObj.toString()))
                }
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get protection status: ${e.message}", e)
        }
    }

    @PluginMethod
    fun unlockApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        val durationMinutes = call.getInt("durationMinutes", 15) ?: 15
        val repsCompleted = call.getInt("repsCompleted", 20) ?: 20
        val autoLaunch = call.getBoolean("autoLaunch", true) ?: true

        try {
            val unlockUntil = protectionStore.unlockApp(packageName, durationMinutes, repsCompleted)

            // Schedule continuous foreground expiry check with Accessibility Service
            PushLockAccessibilityService.scheduleExpiryCheck(packageName, unlockUntil)

            val session = JSObject().apply {
                put("packageName", packageName)
                put("unlockedAt", System.currentTimeMillis())
                put("expiresAt", unlockUntil)
                put("durationMinutes", durationMinutes)
                put("repsCompleted", repsCompleted)
                put("isActive", true)
            }

            // Launch the unlocked app if requested
            if (autoLaunch) {
                launchTargetApp(packageName)
            }

            call.resolve(session)
        } catch (e: Exception) {
            call.reject("Failed to unlock app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun lockApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            PushLockAccessibilityService.cancelExpiryCheck(packageName)
            val success = protectionStore.lockApp(packageName)
            val ret = JSObject().apply { put("success", success) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to lock app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getActiveUnlockSessions(call: PluginCall) {
        try {
            val sessions = protectionStore.getActiveUnlockSessions()
            val jsArray = JSArray()
            for (s in sessions) {
                jsArray.put(JSObject(s.toString()))
            }
            val ret = JSObject().apply {
                put("sessions", jsArray)
            }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get active unlock sessions: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getRemainingUnlockTime(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        val remaining = protectionStore.getRemainingUnlockSeconds(packageName)
        val ret = JSObject().apply {
            put("remainingSeconds", remaining)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun isProtectionServiceEnabled(call: PluginCall) {
        val isRunning = PushLockAccessibilityService.isServiceRunning()
        val isEnabledInSettings = isAccessibilitySettingsEnabled(context)
        val ret = JSObject().apply {
            put("enabled", isRunning || isEnabledInSettings)
            put("serviceRunning", isRunning)
            put("settingsEnabled", isEnabledInSettings)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun openProtectionSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            val ret = JSObject().apply { put("success", true) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to open accessibility settings: ${e.message}", e)
        }
    }

    @PluginMethod
    fun launchApp(call: PluginCall) {
        val packageName = call.getString("packageName")
        if (packageName.isNullOrEmpty()) {
            call.reject("packageName is required")
            return
        }

        try {
            val success = launchTargetApp(packageName)
            val ret = JSObject().apply { put("success", success) }
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to launch app: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getPendingLockTrigger(call: PluginCall) {
        val trigger = pendingLockTrigger
        pendingLockTrigger = null
        val ret = JSObject().apply {
            if (trigger != null) {
                put("hasTrigger", true)
                put("lockTrigger", trigger)
            } else {
                put("hasTrigger", false)
            }
        }
        call.resolve(ret)
    }

    private fun launchTargetApp(packageName: String): Boolean {
        return try {
            val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    private fun isAccessibilitySettingsEnabled(context: Context): Boolean {
        val expectedServiceName = "${context.packageName}/${PushLockAccessibilityService::class.java.canonicalName}"
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = enabledServices.split(":")
        for (componentName in colonSplitter) {
            if (componentName.equals(expectedServiceName, ignoreCase = true) ||
                componentName.contains(PushLockAccessibilityService::class.java.simpleName)) {
                return true
            }
        }
        return false
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        if (activeInstance == this) {
            activeInstance = null
        }
    }
}
