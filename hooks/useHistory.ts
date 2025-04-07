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
      console.log("📦 Historique à sauvegarder :", updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erreur d'ajout à l'historique :", err);
    }
  };

  const getHistory = async (): Promise<StoredRoute[]> => {
    try {
      const historyString = await AsyncStorage.getItem(HISTORY_KEY);
      const parsed = historyString ? JSON.parse(historyString) : [];
      console.log("📜 Historique récupéré :", parsed); // ✅ correction ici
      return parsed;
    } catch (err) {
      console.error("Erreur de lecture de l'historique :", err);
      return [];
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
    } catch (err) {
      console.error("Erreur de suppression de l'historique :", err);
    }
  };

  return {
    addToHistory,
    getHistory,
    clearHistory,
  };
};
