// src/api/apiUtils.ts
import { getAuthToken } from "./authUtils"; // Ajustez le chemin si nécessaire

// --- Configuration ---
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
    throw new Error(
        "CRITICAL ERROR: EXPO_PUBLIC_API_URL is not defined in environment variables."
    );
}

// --- Classe d'Erreur Personnalisée ---
export class ApiError extends Error {
    status: number;
    responseBody: any;

    constructor(message: string, status: number, responseBody?: any) {
        super(message); // Passer le message au constructeur Error
        this.name = "ApiError";
        this.status = status;
        this.responseBody = responseBody || message; // Garder une trace du corps ou au moins du message

        // Maintenir la stack trace (important pour le débogage)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

// --- Interfaces Communes ---
export interface ApiResponse<T = any> {
    message?: string;
    data?: T;
    // Ajoutez d'autres champs communs si votre API en a (ex: pagination, erreurs spécifiques)
    error?: string; // Champ d'erreur potentiel renvoyé par l'API
    token?: string; // Spécifiquement pour le login
}

// Interface pour les données utilisateur (à adapter/compléter selon votre API)
export interface UserData {
    id: string | number;
    username: string;
    email: string;
    profileImage?: string; // Assurez-vous que l'API renvoie bien ce nom
    // Ajoutez d'autres champs nécessaires (ex: roles, etc.)
}

// --- Helper Générique pour les Requêtes ---
async function makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    isAuthenticated: boolean = false, // Indique si l'authentification est requise
    isFormData: boolean = false
): Promise<T> {
    const headers: HeadersInit = {};
    let requestBody: BodyInit | null = null;

    if (isAuthenticated) {
        const authToken = await getAuthToken();
        if (!authToken) {
            throw new ApiError("ApiUtils: User not authenticated.", 401);
        }
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (body) {
        if (isFormData) {
            // Pour FormData, fetch ajoute le bon Content-Type automatiquement
            requestBody = body as FormData;
        } else {
            headers["Content-Type"] = "application/json";
            headers["Accept"] = "application/json";
            requestBody = JSON.stringify(body);
        }
    } else {
        // Même pour GET sans body, on peut spécifier qu'on accepte du JSON
        headers["Accept"] = "application/json";
    }

    const options: RequestInit = {
        method,
        headers,
        body: requestBody,
        // redirect: 'follow', // Généralement géré par défaut, ajoutez si nécessaire
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const responseText = await response.text(); // Toujours lire le texte pour flexibilité

        let responseData: any = null;
        try {
            // Essayer de parser le texte comme JSON, même si la réponse n'est pas ok (pour les messages d'erreur JSON)
            if (responseText) {
                responseData = JSON.parse(responseText);
            }
        } catch (e) {
            // Si le parsing JSON échoue, responseData reste null ou on garde le texte brut
            console.warn(
                `ApiUtils : Could not parse response text as JSON for ${method} ${endpoint}: ${responseText}`
            );
            // Si le parsing échoue MAIS que la réponse est OK (2xx), on peut considérer le texte comme donnée valide
            if (response.ok && responseText) {
                responseData = responseText; // Considérer le texte comme la donnée retournée
            }
        }

        if (!response.ok) {
            // Utiliser le message d'erreur de l'API si disponible, sinon le statut
            const errorMessage =
                responseData?.message ||
                responseData?.error ||
                `ApiUtils : HTTP error! status: ${response.status}`;
            console.error(
                `ApiUtils : HTTP Error ${response.status} on ${method} ${endpoint}:`,
                errorMessage,
                responseText
            );
            throw new ApiError(
                errorMessage,
                response.status,
                responseData? responseData : responseText
            );
        }

        // Si la réponse est OK (2xx)
        return (responseData ?? {}) as T; // Retourne {} si responseData est null/undefined
    } catch (error) {
        if (error instanceof ApiError) {
            throw error; // Relancer l'erreur API déjà formatée
        }
        // Gérer les erreurs réseau ou autres erreurs inattendues
        console.error(
            `ApiUtils : Network or unexpected error during fetch to ${endpoint}:`,
            error
        );
        // Lancer une erreur générique ou une ApiError avec un statut 0 ou 503 ?
        throw new ApiError(
            "ApiUtils : Network request failed. Please check your connection.",
            0,
            error
        );
    }
}

// --- Fonctions Helper Exportées ---

/**
 * Effectue une requête API publique (sans token d'authentification).
 */
export function makePublicRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any
): Promise<T> {
    return makeRequest<T>(endpoint, method, body, false, false);
}

/**
 * Effectue une requête API authentifiée (avec token d'authentification).
 */
export function makeAuthenticatedRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any // Pour JSON
): Promise<T> {
    return makeRequest<T>(endpoint, method, body, true, false);
}

/**
 * Effectue une requête API authentifiée pour envoyer des FormData (ex: upload de fichier).
 */
export function makeAuthenticatedFormDataRequest<T>(
    endpoint: string,
    method: "POST" | "PUT",
    formData: FormData
): Promise<T> {
    // Assurez-vous que formData est bien une instance de FormData
    if (!(formData instanceof FormData)) {
        throw new Error(
            "Invalid body provided for FormData request. Expected FormData instance."
        );
    }
    return makeRequest<T>(endpoint, method, formData, true, true);
}
