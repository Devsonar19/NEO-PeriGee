import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_DISMISSED_KEY = 'neoperigee_pwa_prompt_dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasPromptedAuto, setHasPromptedAuto] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    // Detect mobile device
    const mobile =
      ios ||
      /android|webos|blackberry|iemobile|opera mini/i.test(ua) ||
      (window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window);
    setIsMobile(mobile);

    // If already installed, do not show prompt
    if (isStandalone) {
      return;
    }

    // Auto-open on mobile if not previously dismissed in this session
    const isDismissed = sessionStorage.getItem(PWA_DISMISSED_KEY) === 'true';
    if (mobile && !isDismissed && !hasPromptedAuto) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
        setHasPromptedAuto(true);
      }, 2500); // 2.5s graceful delay so initial view renders smoothly

      return () => clearTimeout(timer);
    }
  }, [hasPromptedAuto]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
      sessionStorage.setItem(PWA_DISMISSED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsModalOpen(false);
        sessionStorage.setItem(PWA_DISMISSED_KEY, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [deferredPrompt]);

  const dismissModal = useCallback(() => {
    setIsModalOpen(false);
    sessionStorage.setItem(PWA_DISMISSED_KEY, 'true');
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isMobile,
    isModalOpen,
    openModal,
    dismissModal,
    install
  };
}
