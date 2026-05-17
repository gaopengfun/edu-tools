import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Router } from 'vue-router';

const STATUS_BAR_COLOR = '#e0f2fe';

export async function setupNativeShell(router: Router): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR });
  } catch (err) {
    console.warn('[capacitor] StatusBar setup failed', err);
  }

  void CapApp.addListener('backButton', () => {
    if (router.currentRoute.value.fullPath === '/') {
      void CapApp.exitApp();
    } else {
      router.back();
    }
  });

  await SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => undefined);
}
