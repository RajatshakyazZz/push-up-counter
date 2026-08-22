package com.pushlock.ai.inventory

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import android.util.LruCache
import com.pushlock.ai.storage.NativeAppProtectionStore
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream

/**
 * AppInventoryManager
 * Discovers real installed user-launchable applications via ACTION_MAIN & CATEGORY_LAUNCHER.
 * Uses an in-memory LruCache for downscaled Base64 icons to minimize memory & bridge payload size.
 */
class AppInventoryManager(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager
    private val protectionStore = NativeAppProtectionStore.getInstance(context)

    companion object {
        private const val ICON_SIZE = 96 // 96x96 px thumbnail
        // LRU Cache for base64 icon data URIs (capacity 150 apps)
        private val iconCache = LruCache<String, String>(150)
    }

    /**
     * Queries all user-launchable launcher apps and merges with protection states.
     */
    fun getInstalledApps(includeIcons: Boolean = true): List<JSONObject> {
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolveInfoList = packageManager.queryIntentActivities(intent, 0)

        val selfPackage = context.packageName
        val appsList = mutableListOf<JSONObject>()
        val seenPackages = mutableSetOf<String>()

        for (resolveInfo in resolveInfoList) {
            val activityInfo = resolveInfo.activityInfo ?: continue
            val pkg = activityInfo.packageName ?: continue

            // Exclude PushLock AI itself so it never locks or lists itself
            if (pkg == selfPackage || seenPackages.contains(pkg)) {
                continue
            }
            seenPackages.add(pkg)

            val appName = resolveInfo.loadLabel(packageManager)?.toString() ?: pkg
            val appInfo = try {
                packageManager.getApplicationInfo(pkg, 0)
            } catch (e: Exception) {
                null
            }

            val category = inferAppCategory(pkg, appInfo)
            val color = getCategoryColor(category)
            val iconName = getCategoryIcon(category)

            val existingProtected = protectionStore.getApp(pkg)
            val isProtected = existingProtected?.optBoolean("isProtected", false) ?: false
            val targetReps = existingProtected?.optInt("targetReps", 20) ?: 20
            val unlockMinutes = existingProtected?.optInt("unlockMinutes", 15) ?: 15
            val timesUnlockedToday = existingProtected?.optInt("timesUnlockedToday", 0) ?: 0
            val totalUnlocks = existingProtected?.optInt("totalUnlocks", 0) ?: 0
            val lastUnlockedAt = existingProtected?.opt("lastUnlockedAt") ?: JSONObject.NULL

            val appJson = JSONObject().apply {
                put("id", "app-$pkg")
                put("packageName", pkg)
                put("name", appName)
                put("category", category)
                put("color", color)
                put("iconName", iconName)
                put("targetReps", targetReps)
                put("unlockMinutes", unlockMinutes)
                put("isProtected", isProtected)
                put("timesUnlockedToday", timesUnlockedToday)
                put("totalUnlocks", totalUnlocks)
                put("lastUnlockedAt", lastUnlockedAt)
                put("isSystem", (appInfo?.flags?.and(ApplicationInfo.FLAG_SYSTEM)) != 0)

                if (includeIcons) {
                    val iconDataUri = getAppIconDataUri(pkg, resolveInfo.loadIcon(packageManager))
                    if (iconDataUri.isNotEmpty()) {
                        put("iconDataUri", iconDataUri)
                    }
                }
            }
            appsList.add(appJson)
        }

        // Sort: protected apps first, then alphabetically by app name
        appsList.sortWith { a, b ->
            val aProt = if (a.optBoolean("isProtected", false)) 0 else 1
            val bProt = if (b.optBoolean("isProtected", false)) 0 else 1
            if (aProt != bProt) {
                aProt.compareTo(bProt)
            } else {
                a.optString("name", "").compareTo(b.optString("name", ""), ignoreCase = true)
            }
        }

        return appsList
    }

    /**
     * Converts a package icon Drawable to a compressed Base64 Data URI with LRU caching.
     */
    fun getAppIconDataUri(packageName: String, drawable: Drawable?): String {
        if (drawable == null) return ""
        val cached = iconCache.get(packageName)
        if (cached != null) return cached

        return try {
            val bitmap = drawableToBitmap(drawable)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 85, outputStream)
            val byteArray = outputStream.toByteArray()
            val base64 = Base64.encodeToString(byteArray, Base64.NO_WRAP)
            val dataUri = "data:image/png;base64,$base64"
            iconCache.put(packageName, dataUri)
            dataUri
        } catch (e: Exception) {
            e.printStackTrace()
            ""
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            val orig = drawable.bitmap
            if (orig.width == ICON_SIZE && orig.height == ICON_SIZE) {
                return orig
            }
            return Bitmap.createScaledBitmap(orig, ICON_SIZE, ICON_SIZE, true)
        }

        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else ICON_SIZE
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else ICON_SIZE

        val bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun inferAppCategory(packageName: String, appInfo: ApplicationInfo?): String {
        val lower = packageName.toLowerCase()
        return when {
            lower.contains("instagram") || lower.contains("snapchat") || lower.contains("tiktok") ||
            lower.contains("facebook") || lower.contains("twitter") || lower.contains("reddit") ||
            lower.contains("threads") || lower.contains("discord") || lower.contains("telegram") ||
            lower.contains("whatsapp") || lower.contains("social") -> "social"

            lower.contains("youtube") || lower.contains("netflix") || lower.contains("hulu") ||
            lower.contains("primevideo") || lower.contains("disney") || lower.contains("twitch") ||
            lower.contains("spotify") || lower.contains("music") || lower.contains("video") -> "entertainment"

            lower.contains("game") || lower.contains("supercell") || lower.contains("king.") ||
            lower.contains("roblox") || lower.contains("ea.") || lower.contains("pubg") ||
            (appInfo != null && (appInfo.flags and ApplicationInfo.FLAG_IS_GAME) != 0) -> "gaming"

            lower.contains("notion") || lower.contains("slack") || lower.contains("todo") ||
            lower.contains("docs") || lower.contains("sheets") || lower.contains("keep") -> "productivity"

            else -> "custom"
        }
    }

    private fun getCategoryColor(category: String): String {
        return when (category) {
            "social" -> "#E1306C"
            "entertainment" -> "#EF4444"
            "gaming" -> "#8B5CF6"
            "productivity" -> "#2563EB"
            else -> "#16A34A"
        }
    }

    private fun getCategoryIcon(category: String): String {
        return when (category) {
            "social" -> "instagram"
            "entertainment" -> "youtube"
            "gaming" -> "gamepad"
            "productivity" -> "shield"
            else -> "shield"
        }
    }
}
