"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/client";
import { doc, setDoc } from "firebase/firestore";

export function Celebration() {
  const { onboarding, isLoading } = useDashboardData();
  const { user } = useAuth();
  const [hasFired, setHasFired] = useState(false);

  useEffect(() => {
    if (isLoading || !user || hasFired) return;

    if (onboarding?.steps?.campaignLaunched && !onboarding.hasSeenCelebration) {
      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      setTimeout(() => setHasFired(true), 0);

      // Write to Firestore so it doesn't fire again
      try {
        const docRef = doc(db, "users", user.uid);
        setDoc(docRef, {
          onboarding: { hasSeenCelebration: true }
        }, { merge: true });
      } catch (e) {
        console.error("FAILED WRITE:", `users/${user.uid}`, { onboarding: { hasSeenCelebration: true } }, e);
        console.error("Authenticated UID:", user.uid);
      }
    }
  }, [isLoading, onboarding.steps.campaignLaunched, onboarding.hasSeenCelebration, user, hasFired]);

  return null;
}
