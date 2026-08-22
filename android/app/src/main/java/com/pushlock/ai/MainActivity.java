package com.pushlock.ai;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.pushlock.ai.plugin.PushLockAppLockerPlugin;
import com.pushlock.ai.service.PushLockAccessibilityService;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PushLockAppLockerPlugin.class);
        super.onCreate(savedInstanceState);
        handleIncomingLockIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingLockIntent(intent);
    }

    private void handleIncomingLockIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (PushLockAccessibilityService.ACTION_LOCK_APP.equals(action)) {
            String packageName = intent.getStringExtra(PushLockAccessibilityService.EXTRA_LOCKED_PACKAGE);
            if (packageName != null && !packageName.isEmpty()) {
                String appName = intent.getStringExtra(PushLockAccessibilityService.EXTRA_APP_NAME);
                int targetReps = intent.getIntExtra(PushLockAccessibilityService.EXTRA_TARGET_REPS, 20);
                int unlockMinutes = intent.getIntExtra(PushLockAccessibilityService.EXTRA_UNLOCK_MINUTES, 15);
                String category = intent.getStringExtra(PushLockAccessibilityService.EXTRA_CATEGORY);
                String iconName = intent.getStringExtra(PushLockAccessibilityService.EXTRA_ICON_NAME);
                String color = intent.getStringExtra(PushLockAccessibilityService.EXTRA_COLOR);

                PushLockAppLockerPlugin.Companion.notifyLockTrigger(
                    packageName,
                    appName != null ? appName : packageName,
                    targetReps,
                    unlockMinutes,
                    category != null ? category : "custom",
                    iconName != null ? iconName : "shield",
                    color != null ? color : "#16A34A"
                );
            }
        }
    }
}

