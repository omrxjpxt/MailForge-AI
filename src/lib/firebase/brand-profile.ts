import { db } from "./client";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { BrandProfile } from "@/types/ai-generation";

export const getBrandProfileDocRef = (userId: string) => {
  return doc(db, "users", userId, "brandProfile", "default");
};

export const getBrandProfile = async (userId: string): Promise<BrandProfile | null> => {
  const docRef = getBrandProfileDocRef(userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as BrandProfile;
  }
  return null;
};

export const saveBrandProfile = async (userId: string, data: Partial<BrandProfile>): Promise<void> => {
  const docRef = getBrandProfileDocRef(userId);
  await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
};
