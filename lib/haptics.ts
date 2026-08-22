/**
 * Clean haptic feedback abstraction layer for Web and Android Native.
 */
export function triggerHaptic(type: 'rep' | 'success' | 'warning' | 'error' | 'click' | 'lock') {
  if (typeof window === 'undefined') return;

  // Check if Web Vibration API is supported
  if ('vibrate' in navigator) {
    try {
      switch (type) {
        case 'rep':
          // Crisp, short tactile pulse on verified rep
          navigator.vibrate(40);
          break;
        case 'success':
          // Double celebratory vibration on unlock
          navigator.vibrate([60, 50, 100]);
          break;
        case 'warning':
          // Form warning vibration
          navigator.vibrate([80, 40, 80]);
          break;
        case 'error':
          // Tripled error pattern
          navigator.vibrate([100, 50, 100, 50, 150]);
          break;
        case 'click':
          navigator.vibrate(15);
          break;
        case 'lock':
          navigator.vibrate(80);
          break;
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }
}
