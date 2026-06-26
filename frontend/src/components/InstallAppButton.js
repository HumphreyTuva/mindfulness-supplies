// src/components/InstallAppButton.jsx
import React, { useEffect, useState } from 'react';

const InstallAppButton = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Only show if not installed and not previously dismissed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('installPromptDismissed');

    if (isInstalled || dismissed === 'true') return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Trigger attention animation after 5 seconds
    const animateTimeout = setTimeout(() => setAnimate(true), 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(animateTimeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
      localStorage.setItem('installPromptDismissed', 'true');
    }

    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
  <button
    onClick={handleInstall}
    className={`px-6 py-3 rounded-full text-orange-600 bg-white shadow-lg hover:bg-orange-100 transition-all duration-300 ${
      animate ? 'animate-bounceOnce' : ''
    } ${className}`}
  >
    📲 Install Our App
  </button>

);

};

export default InstallAppButton;
