import {
    makeAuthenticatedRequest,
    makeAuthenticatedFormDataRequest,
    ApiResponse,
    UserData,
} from "../../utils/apiUtils";

// --- Interfaces spécifiques à l'utilisateur ---
export interface UpdateUserPayload {
    username?: string;
    email?: string;
    oldPassword?: string;
    newPassword?: string;
}

export interface LocationData {
    latitude: number;
    longitude: number;
}

// Interface pour la réponse de mise à jour d'image (si elle est spécifique)
export interface UpdateProfileImageResponse
    extends ApiResponse<{ imageUrl?: string; message?: string }> {
    imageUrl?: string;
    message?: string;
}

// --- Fonctions API ---

/**
 * Récupère les données de l'utilisateur connecté.
 * @returns {Promise<any>} Les données de l'utilisateur.
 */
export async function getUserDataApi(): Promise<any> {
    try {
        const response = await makeAuthenticatedRequest<any>(
            "/private/user",
            "POST"
        );
        
        // Vérifier si la réponse contient une erreur
        if (response && response.error) {
            throw new Error(response.error);
        }
        
        // Vérifier que la réponse contient les données attendues (par exemple, au moins username et email)
        if (response && response.username && response.email) {
            return response as UserData;
        }
        
        throw new Error("Invalid user data received from API");
    } catch (error) {
        console.error("getUserDataApi error:", error);
        throw error instanceof Error ? error : new Error("Failed to fetch user data");
    }
}

/**
 * Met à jour les informations de l'utilisateur connecté.
 * @param data Les champs à mettre à jour.
 * @returns {Promise<any>} Les données utilisateur mises à jour.
 */
export async function updateUserApi(
    data: UpdateUserPayload
): Promise<UserData> {
    // Filtrer les clés non vides/null/undefined pour n'envoyer que les modifications
    const payload: Partial<UpdateUserPayload> = {};
    (Object.keys(data) as Array<keyof UpdateUserPayload>).forEach((key) => {
        if (
            data[key] !== null 
            && data[key] !== undefined 
            && data[key] !== ""
        ) {
            payload[key] = data[key];
        }
    });

    console.log("updateUserApi payload:", payload); // Pour le débogage
    if (Object.keys(payload).length === 0) {
        throw new Error("No fields provided to update.");
    }

    try {
        const response = await makeAuthenticatedRequest<any>(
            "/private/user",
            "PUT",
            payload
        );
        console.log("updateUserApi response:", response); // Pour le débogage
        
        // Vérifier si le texte contient "successfully"
        if (response.includes("successfully")) {
            // Récupérer les données actualisées de l'utilisateur
            return await getUserDataApi();
        } else {
            throw new Error(response || "Update failed");
        }
    } catch (error) {
        console.error("updateUserApi error:", error);
        throw error instanceof Error ? error : new Error("Failed to update user data");
    }
}

/**
 * Met à jour l'image de profil de l'utilisateur.
 * @param imageFile L'objet fichier image (souvent { uri, name, type } dans RN).
 * @returns {Promise<UpdateProfileImageResponse>} Réponse de l'API (peut contenir URL ou message).
 */
export async function updateProfileImageApi(imageFile: {
    uri: string;
    name?: string;
    type?: string;
}): Promise<UpdateProfileImageResponse> {
    const formData = new FormData();

    const fileData: any = {
        uri: imageFile.uri,
        name: imageFile.name || `profile-${Date.now()}.jpg`,
        type: imageFile.type || "image/jpeg",
    };
    formData.append("file", fileData);

    // Utiliser l'endpoint /private/user/profile-image comme suggéré dans l'ancien code
    return makeAuthenticatedFormDataRequest<UpdateProfileImageResponse>(
        "/private/user/profile-image",
        "POST",
        formData
    );
}

/**
 * Supprime le compte de l'utilisateur connecté.
 * @returns {Promise<void>} Résout si la suppression réussit.
 */
export async function deleteProfileApi(): Promise<void> {
    await makeAuthenticatedRequest<void>("/private/user", "DELETE");
}

/**
 * Met à jour la localisation de l'utilisateur.
 * @param location Coordonnées latitude et longitude.
 * @returns {Promise<UserData>} Les données utilisateur mises à jour (si l'API les renvoie).
 */
export async function updateUserLocationApi(
    location: LocationData
): Promise<UserData> {
    const payload = { location };
    const response = await makeAuthenticatedRequest<ApiResponse<UserData>>(
        "/private/user/location",
        "PUT",
        payload
    );
    if (!response.data) {
        throw new Error(
            "Updated user data not found in API response after location update."
        );
    }
    return response.data;
}

export async function rateApp(
    rate: number,
): Promise<any> {
    try {
        const payload = { rate };
        const response = await makeAuthenticatedRequest<any>(
            "/private/user/app/rate",
            "POST",
            payload
        );
        
        // Vérifier si la réponse contient une erreur
        if (response && response.error) {
            throw new Error(response.error);
        }
        return response;
        
        throw new Error("Invalid user data received from API");
    } catch (error) {
        console.error("getUserDataApi error:", error);
        throw error instanceof Error ? error : new Error("Failed to fetch user data");
    }
}
