import { getAuthToken } from "./authUtils";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE_URL) {
    throw new Error(
        "CRITICAL ERROR: EXPO_PUBLIC_API_URL is not defined in environment variables."
    );
}

export class ApiError extends Error {
    status: number;
    responseBody: any;

    constructor(message: string, status: number, responseBody?: any) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.responseBody = responseBody || message;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}

export interface ApiResponse<T = any> {
    message?: string;
    data?: T;
    error?: string;
    token?: string;
}

export interface UserData {
    id: string | number;
    username: string;
    email: string;
    profileImage?: string;
}


async function makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    isAuthenticated: boolean = false,
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
            requestBody = body as FormData;
        } else {
            headers["Content-Type"] = "application/json";
            headers["Accept"] = "application/json";
            requestBody = JSON.stringify(body);
        }
    } else {
        headers["Accept"] = "application/json";
    }

    const options: RequestInit = {
        method,
        headers,
        body: requestBody,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const responseText = await response.text();

        let responseData: any = null;
        try {
            if (responseText) {
                responseData = JSON.parse(responseText);
            }
        } catch (e) {
            if (response.ok && responseText) {
                responseData = responseText;
            }
        }

        if (!response.ok) {
            const errorMessage =
                responseData?.message ||
                responseData?.error ||
                `ApiUtils : HTTP error! status: ${response.status}`;
            throw new ApiError(
                errorMessage,
                response.status,
                responseData? responseData : responseText
            );
        }

        return (responseData ?? {}) as T;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error; 
        }
        throw new ApiError(
            "ApiUtils : Network request failed. Please check your connection.",
            0,
            error
        );
    }
}

export function makePublicRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any
): Promise<T> {
    return makeRequest<T>(endpoint, method, body, false, false);
}

export function makeAuthenticatedRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any
): Promise<T> {
    return makeRequest<T>(endpoint, method, body, true, false);
}

export function makeAuthenticatedFormDataRequest<T>(
    endpoint: string,
    method: "POST" | "PUT",
    formData: FormData
): Promise<T> {
    if (!(formData instanceof FormData)) {
        throw new Error(
            "Invalid body provided for FormData request. Expected FormData instance."
        );
    }
    return makeRequest<T>(endpoint, method, formData, true, true);
}

export interface UserData {
    id: string | number;
    username: string;
    email: string;
    profileImage?: string;
    role: string;

    navigationPreferences: {
        avoidTolls: boolean;
        avoidHighways: boolean;
        avoidTraffic: boolean;
        showUsers: boolean;
        proximityAlertDistance: number;
        preferredTransportMode: string;
    };

    favoriteLocations: {
        name: string;
        formattedAddress: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        placeId: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        locationType: string;
    }[];

    stats: {
        totalReportsSubmitted: number;
        validatedReports: number;
        totalRoutesCompleted: number;
        totalDistanceTraveled: number;
        totalTimeSaved: number;
        reportsValidatedByOthers: number;
        rank: string;
        rankImage: string;
        error: string | null;
    };

    notificationSettings: {
        emailEnabled: boolean;
    };

    lastKnownLocation: {
        latitude: number;
        longitude: number;
    };

    isValidEmail: boolean;
    hasVoted: boolean;
    error: string | null;
}
