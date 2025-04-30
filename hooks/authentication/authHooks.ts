// src/api/authApi.ts
import { makePublicRequest, ApiResponse, ApiError } from "../../utils/apiUtils";

// --- Interfaces spécifiques à l'authentification ---
export interface LoginResponse extends ApiResponse<{ token?: string }> {
    // La réponse de login contient souvent un token
    token?: string; // Répété pour accès direct plus facile
}

export interface RegisterPayload {
    username: string;
    email: string;
    password?: string; // Mot de passe optionnel si enregistrement via Google/autre ?
}

export interface GenericMessageResponse
    extends ApiResponse<{ message?: string }> {
    message?: string; // Pour les réponses simples type "Email sent"
}

// --- Fonctions API ---

/**
 * Tente de connecter l'utilisateur.
 * Retourne le token d'authentification en cas de succès.
 * Lance une ApiError en cas d'échec.
 * @param email L'email de l'utilisateur.
 * @param password Le mot de passe de l'utilisateur.
 * @returns {Promise<string>} Le token JWT.
 */
export async function loginApi(
    email: string,
    password?: string
): Promise<string> {
    try {
        // Adaptez le payload si votre API attend autre chose (ex: pour login Google/OAuth)
        const payload = { email, password };
        const response = await makePublicRequest<string>(
            "/auth/login",
            "POST",
            payload
        );

        // Vérifier si la réponse est bien une chaîne non vide
        // (Ajouter une vérification basique pour s'assurer que ça ressemble à un token JWT)
        if (typeof response === 'string' && response.length > 10) {
            return response;
        } else {
            // Si la réponse est OK mais vide ou n'est pas une chaîne, c'est un problème
            console.error("Login successful but received an unexpected response format instead of a token string:", response);
            throw new ApiError("Login failed: Unexpected response format received from server.", 500, response);
        }
    } catch (error) {
        if (error instanceof ApiError) {
            console.error(
                `Login API error (${error.status}): ${error.message}`,
                error.responseBody
            );
        } else {
            console.error("Unexpected error during login:", error);
        }
        // Relancer l'erreur pour que l'UI puisse la gérer
        throw error;
    }
}

/**
 * Enregistre un nouvel utilisateur.
 * @param payload Données d'enregistrement (username, email, password).
 * @returns {Promise<GenericMessageResponse>} Réponse de succès (souvent un message).
 */
export async function registerApi(
    payload: RegisterPayload
): Promise<GenericMessageResponse> {
    return makePublicRequest<GenericMessageResponse>(
        "/auth/register",
        "POST",
        payload
    );
}

/**
 * Renvoie l'email de confirmation.
 * @param email L'email de l'utilisateur.
 * @returns {Promise<GenericMessageResponse>} Réponse de succès.
 */
export async function sendValidationEmailAgainApi(
    email: string
): Promise<GenericMessageResponse> {
    return makePublicRequest<GenericMessageResponse>(
        "/auth/resend-confirmation-email",
        "POST",
        { email }
    );
}

/**
 * Demande la réinitialisation du mot de passe.
 * @param email L'email de l'utilisateur.
 * @returns {Promise<GenericMessageResponse>} Réponse de succès.
 */
export async function forgotPasswordApi(
    email: string
): Promise<GenericMessageResponse> {
    return makePublicRequest<GenericMessageResponse>(
        "/auth/forgot-password",
        "POST",
        { email }
    );
}

/**
 * Réinitialise le mot de passe avec un token.
 * @param token Le token reçu par email.
 * @param newPassword Le nouveau mot de passe.
 * @returns {Promise<GenericMessageResponse>} Réponse de succès.
 */
export async function resetPasswordApi(
    token: string,
    newPassword: string
): Promise<GenericMessageResponse> {
    return makePublicRequest<GenericMessageResponse>(
        "/auth/reset-password",
        "POST",
        { token, newPassword }
    );
}
