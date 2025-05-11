import {
    makeAuthenticatedRequest,
    makeAuthenticatedFormDataRequest,
    ApiResponse,
    UserData,
} from "../../utils/apiUtils";

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

export interface UpdateProfileImageResponse
    extends ApiResponse<{ imageUrl?: string; message?: string }> {
    imageUrl?: string;
    message?: string;
}


/**
 * @returns {Promise<any>}
 */
export async function getUserDataApi(): Promise<any> {
    try {
        const response = await makeAuthenticatedRequest<any>(
            "/private/user",
            "POST"
        );
        
        if (response && response.error) {
            throw new Error(response.error);
        }
        
        if (response && response.username && response.email) {
            return response as UserData;
        }
        
        throw new Error("Invalid user data received from API");
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to fetch user data");
    }
}

/**
 * @param data
 * @returns {Promise<any>}
 */
export async function updateUserApi(
    data: UpdateUserPayload
): Promise<UserData> {
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

    if (Object.keys(payload).length === 0) {
        throw new Error("No fields provided to update.");
    }

    try {
        const response = await makeAuthenticatedRequest<any>(
            "/private/user",
            "PUT",
            payload
        );
        
        if (response.includes("successfully")) {
            return await getUserDataApi();
        } else {
            throw new Error(response || "Update failed");
        }
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to update user data");
    }
}

/**
 * @param imageFile
 * @returns {Promise<UpdateProfileImageResponse>}
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

    return makeAuthenticatedFormDataRequest<UpdateProfileImageResponse>(
        "/private/user/profile-image",
        "POST",
        formData
    );
}

/**
 * @returns {Promise<void>}
 */
export async function deleteProfileApi(): Promise<void> {
    await makeAuthenticatedRequest<void>("/private/user", "DELETE");
}

/**
 * @param location
 * @returns {Promise<UserData>}
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
        
        if (response && response.error) {
            throw new Error(response.error);
        }
        return response;
        
        throw new Error("Invalid user data received from API");
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to fetch user data");
    }
}
