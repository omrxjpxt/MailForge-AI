import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { onSnapshot } from "firebase/firestore";
import { getBrandProfileDocRef, saveBrandProfile } from "@/lib/firebase/brand-profile";
import { BrandProfile } from "@/types/ai-generation";

export function useBrandProfile() {
  const { user, loading: authLoading } = useAuth();
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setBrandProfile(null);
      setIsLoading(false);
      return;
    }

    const docRef = getBrandProfileDocRef(user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setBrandProfile(docSnap.data() as BrandProfile);
        } else {
          setBrandProfile(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching brand profile:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const updateBrandProfile = async (data: Partial<BrandProfile>) => {
    if (!user) throw new Error("Must be logged in");
    await saveBrandProfile(user.uid, data);
  };

  return {
    brandProfile,
    isLoading,
    updateBrandProfile,
  };
}
