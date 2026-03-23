import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserSettings } from '../types';

const getUserSettingsDoc = (uid: string) => doc(db, 'users', uid, 'settings', 'preferences');

const createEmptySettings = (): UserSettings => ({
  geminiApiKey: '',
  hasGeminiApiKey: false,
  updatedAt: 0,
});

const normalizeSettings = (data: Partial<UserSettings> | undefined): UserSettings => {
  const geminiApiKey = typeof data?.geminiApiKey === 'string' ? data.geminiApiKey.trim() : '';
  const hasGeminiApiKey =
    typeof data?.hasGeminiApiKey === 'boolean' ? data.hasGeminiApiKey : geminiApiKey.length > 0;
  const updatedAt = typeof data?.updatedAt === 'number' ? data.updatedAt : 0;

  return {
    geminiApiKey,
    hasGeminiApiKey: hasGeminiApiKey && geminiApiKey.length > 0,
    updatedAt,
  };
};

export const getUserSettings = async (uid: string): Promise<UserSettings> => {
  const settingsDoc = await getDoc(getUserSettingsDoc(uid));
  if (!settingsDoc.exists()) {
    return createEmptySettings();
  }

  return normalizeSettings(settingsDoc.data() as Partial<UserSettings>);
};

export const saveUserSettings = async (uid: string, settings: Partial<UserSettings>): Promise<UserSettings> => {
  const normalized = normalizeSettings({
    ...createEmptySettings(),
    ...settings,
    updatedAt: Date.now(),
  });

  await setDoc(getUserSettingsDoc(uid), normalized, { merge: true });
  return normalized;
};
