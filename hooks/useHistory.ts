import AsyncStorage from "@react-native-async-storage/async-storage";
import { TransportMode } from "@/types";

const HISTORY_KEY = "gps_app_history";

export interface StoredRoute {
  id: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  mode: TransportMode;
  date: string;
}

export const useHistory = () => {
  const addToHistory = async (route: Omit<StoredRoute, "id" | "date">) => {
    try {
      const historyString = await AsyncStorage.getItem(HISTORY_KEY);
      const history: StoredRoute[] = historyString ? JSON.parse(historyString) : [];

      const newEntry: StoredRoute = {
        ...route,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };

      const updated = [newEntry, ...history].slice(0, 20);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
    }
  };

  const getHistory = async (): Promise<StoredRoute[]> => {
    try {
      const historyString = await AsyncStorage.getItem(HISTORY_KEY);
      const parsed = historyString ? JSON.parse(historyString) : [];
      parsed.slice(-3);
      return parsed;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    addToHistory,
    getHistory,
    clearHistory,
  };
};
