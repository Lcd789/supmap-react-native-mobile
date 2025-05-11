import { makePublicRequest, ApiResponse, ApiError } from "../../utils/apiUtils";

export interface LoginResponse extends ApiResponse<{ token?: string }> {
    token?: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password?: string;
}

export interface GenericMessageResponse
    extends ApiResponse<{ message?: string }> {
    message?: string;
}


/**
 * @param email 
 * @param password 
 * @returns {Promise<string>}
 */
export async function loginApi(
    email: string,
    password?: string
): Promise<string> {
    try {
        const payload = { email, password };
        const response = await makePublicRequest<string>(
            "/auth/login",
            "POST",
            payload
        );

        if (typeof response === 'string' && response.length > 10) {
            return response;
        } else {
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
        throw error;
    }
}

/**
 * @param payload
 * @returns {Promise<GenericMessageResponse>}
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
 * @param email
 * @returns {Promise<GenericMessageResponse>}
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
 * @param email
 * @returns {Promise<GenericMessageResponse>}
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
 * @param token
 * @param newPassword
 * @returns {Promise<GenericMessageResponse>}
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
