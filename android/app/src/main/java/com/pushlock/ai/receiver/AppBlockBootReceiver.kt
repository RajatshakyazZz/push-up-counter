package com.pushlock.ai.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.pushlock.ai.blocker.AppBlockerManager

class AppBlockBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            AppBlockerManager.init(context)
            AppBlockerManager.startBlockService(context)
        }
    }
}
