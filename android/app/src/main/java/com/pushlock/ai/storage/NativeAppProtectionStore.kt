package com.pushlock.ai.storage

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * NativeAppProtectionStore
 * Persistent SharedPreferences-backed single source of truth for PushLock AI.
 * Stores protected app configurations, rep requirements, and active screen-time balances.
 */
class NativeAppProtectionStore private constructor(private val appContext: Context) {

    private val prefs: SharedPreferences =
        appContext.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "pushlock_native_protection_store"
        private const val KEY_PROTECTED_APPS = "protected_apps_json"
        private const val KEY_LAST_DAY = "last_recorded_day"

        @Volatile
        private var instance: NativeAppProtectionStore? = null

        fun getInstance(context: Context): NativeAppProtectionStore {
            return instance ?: synchronized(this) {
                instance ?: NativeAppProtectionStore(context.applicationContext).also { instance = it }
            }
        }
    }

    init {
        checkAndResetDailyCounts()
    }

    private fun checkAndResetDailyCounts() {
        val currentDay = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        val savedDay = prefs.getString(KEY_LAST_DAY, null)
        if (savedDay != currentDay) {
            val apps = getAllAppsMap()
            var modified = false
            for ((_, json) in apps) {
                if (json.optInt("timesUnlockedToday", 0) > 0) {
                    json.put("timesUnlockedToday", 0)
                    modified = true
                }
            }
            if (modified) {
                saveAllAppsMap(apps)
            }
            prefs.edit().putString(KEY_LAST_DAY, currentDay).apply()
        }
    }

    @Synchronized
    private fun getAllAppsMap(): MutableMap<String, JSONObject> {
        val jsonStr = prefs.getString(KEY_PROTECTED_APPS, null) ?: return mutableMapOf()
        val map = mutableMapOf<String, JSONObject>()
        try {
            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                val pkg = obj.optString("packageName", "")
                if (pkg.isNotEmpty()) {
                    map[pkg] = obj
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return map
    }

    @Synchronized
    private fun saveAllAppsMap(map: Map<String, JSONObject>) {
        val jsonArray = JSONArray()
        val blockedSet = mutableSetOf<String>()
        for ((pkg, obj) in map) {
            jsonArray.put(obj)
            if (obj.optBoolean("isProtected", false)) {
                blockedSet.add(pkg)
            }
        }
        prefs.edit().putString(KEY_PROTECTED_APPS, jsonArray.toString()).apply()
        com.pushlock.ai.blocker.AppBlockerManager.setBlockedPackages(appContext, blockedSet)
    }

    @Synchronized
    fun getAllProtectedApps(): List<JSONObject> {
        checkAndResetDailyCounts()
        val map = getAllAppsMap()
        return map.values.toList()
    }

    @Synchronized
    fun getApp(packageName: String): JSONObject? {
        val map = getAllAppsMap()
        return map[packageName]
    }

    @Synchronized
    fun protectApp(
        packageName: String,
        appName: String,
        targetReps: Int,
        unlockMinutes: Int,
        rewardSecondsPerRep: Int = 60,
        category: String = "custom",
        iconName: String = "shield",
        color: String = "#16A34A"
    ): JSONObject {
        val map = getAllAppsMap()
        val existing = map[packageName]
        val appObj = existing ?: JSONObject().apply {
            put("id", "app-${System.currentTimeMillis()}")
            put("packageName", packageName)
            put("timesUnlockedToday", 0)
            put("totalUnlocks", 0)
            put("lastUnlockedAt", JSONObject.NULL)
            put("remainingScreenTimeSeconds", 0L)
            put("unlockUntil", 0L)
        }

        val calculatedMinutes = if (rewardSecondsPerRep > 0 && targetReps > 0) {
            Math.max(1, (targetReps * rewardSecondsPerRep + 59) / 60)
        } else {
            unlockMinutes
        }

        appObj.put("name", appName)
        appObj.put("targetReps", targetReps)
        appObj.put("rewardSecondsPerRep", rewardSecondsPerRep)
        appObj.put("unlockMinutes", calculatedMinutes)
        appObj.put("category", category)
        appObj.put("iconName", iconName)
        appObj.put("color", color)
        appObj.put("isProtected", true)

        map[packageName] = appObj
        saveAllAppsMap(map)
        return appObj
    }

    @Synchronized
    fun unprotectApp(packageName: String): Boolean {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return false
        app.put("isProtected", false)
        map[packageName] = app
        saveAllAppsMap(map)
        return true
    }

    @Synchronized
    fun toggleProtection(packageName: String, isProtected: Boolean): Boolean {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return false
        app.put("isProtected", isProtected)
        map[packageName] = app
        saveAllAppsMap(map)
        return true
    }

    @Synchronized
    fun deleteApp(packageName: String): Boolean {
        val map = getAllAppsMap()
        val removed = map.remove(packageName) != null
        if (removed) {
            saveAllAppsMap(map)
        }
        return removed
    }

    /**
     * Unlocks an app with active screen time (durationMinutes).
     * Returns remaining screen time in seconds.
     */
    @Synchronized
    fun unlockApp(packageName: String, durationMinutes: Int, repsCompleted: Int): Long {
        val now = System.currentTimeMillis()
        val totalSeconds = durationMinutes * 60L
        val map = getAllAppsMap()
        val app = map[packageName] ?: JSONObject().apply {
            put("id", "app-$now")
            put("packageName", packageName)
            put("name", packageName)
            put("category", "custom")
            put("iconName", "shield")
            put("color", "#16A34A")
            put("targetReps", repsCompleted)
            put("unlockMinutes", durationMinutes)
            put("isProtected", true)
            put("timesUnlockedToday", 0)
            put("totalUnlocks", 0)
        }

        app.put("remainingScreenTimeSeconds", totalSeconds)
        app.put("unlockUntil", now + (totalSeconds * 1000L))
        app.put("lastUnlockedAt", now)
        app.put("timesUnlockedToday", app.optInt("timesUnlockedToday", 0) + 1)
        app.put("totalUnlocks", app.optInt("totalUnlocks", 0) + 1)

        map[packageName] = app
        saveAllAppsMap(map)
        com.pushlock.ai.blocker.AppBlockerManager.addEarnedTime(appContext, totalSeconds)
        return totalSeconds
    }

    /**
     * Deducts active foreground seconds from the app's screen-time balance.
     * Returns the updated remaining screen time in seconds.
     */
    @Synchronized
    fun deductScreenTime(packageName: String, seconds: Long = 1L): Long {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return 0L
        val current = app.optLong("remainingScreenTimeSeconds", 0L)
        val updated = Math.max(0L, current - seconds)
        app.put("remainingScreenTimeSeconds", updated)
        if (updated <= 0L) {
            app.put("unlockUntil", 0L)
        }
        map[packageName] = app
        saveAllAppsMap(map)
        return updated
    }

    @Synchronized
    fun getRemainingScreenTimeSeconds(packageName: String): Long {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return 0L
        return app.optLong("remainingScreenTimeSeconds", 0L)
    }

    @Synchronized
    fun lockApp(packageName: String): Boolean {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return false
        app.put("remainingScreenTimeSeconds", 0L)
        app.put("unlockUntil", 0L)
        map[packageName] = app
        saveAllAppsMap(map)
        return true
    }

    /**
     * Determines whether the app is currently locked.
     * An app is locked if isProtected == true AND remainingScreenTimeSeconds <= 0.
     */
    @Synchronized
    fun isAppLocked(packageName: String): Boolean {
        val map = getAllAppsMap()
        val app = map[packageName] ?: return false
        val isProtected = app.optBoolean("isProtected", false)
        if (!isProtected) return false

        val remaining = app.optLong("remainingScreenTimeSeconds", 0L)
        return remaining <= 0L
    }

    @Synchronized
    fun getRemainingUnlockSeconds(packageName: String): Long {
        return getRemainingScreenTimeSeconds(packageName)
    }

    @Synchronized
    fun getActiveUnlockSessions(): List<JSONObject> {
        val now = System.currentTimeMillis()
        val map = getAllAppsMap()
        val sessions = mutableListOf<JSONObject>()
        for ((_, app) in map) {
            val remainingSec = app.optLong("remainingScreenTimeSeconds", 0L)
            if (app.optBoolean("isProtected", false) && remainingSec > 0L) {
                val session = JSONObject().apply {
                    put("packageName", app.optString("packageName"))
                    put("appName", app.optString("name"))
                    put("unlockedAt", app.optLong("lastUnlockedAt", now))
                    put("expiresAt", now + (remainingSec * 1000L))
                    put("remainingSeconds", remainingSec)
                    put("durationMinutes", app.optInt("unlockMinutes", 15))
                    put("repsCompleted", app.optInt("targetReps", 20))
                    put("isActive", true)
                }
                sessions.add(session)
            }
        }
        return sessions
    }

    @Synchronized
    fun resetAllData() {
        prefs.edit().clear().apply()
    }
}
