import * as SecureStore from "expo-secure-store";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function getUserData() {
    const authToken = await SecureStore.getItemAsync('authToken');

    if (!authToken) {
        return {};
    }

    try {
        const response = await fetch(`https://supmap-api.up.railway.app/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        return {};
    }
}

export async function updateUser(username, email, oldPassword, newPassword) {
    
    const authToken = await SecureStore.getItemAsync('authToken');

    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/user/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ username, email, oldPassword, newPassword }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function deleteProfileImage() {
    const authToken = await SecureStore.getItemAsync('authToken');


    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function updateProfileImage(imageFile) {
    const authToken = await SecureStore.getItemAsync('authToken');


    if (!authToken) {
        return {};
    }

    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function getProfileImage() {
    const authToken = await SecureStore.getItemAsync('authToken');


    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/user/profile-image`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return data.imageUrl || '';
}

export async function deleteProfile() {
    const authToken = await SecureStore.getItemAsync('authToken');


    if (!authToken) {
        return {};
    }

    const response = await fetch(`https://supmap-api.up.railway.app/user/delete`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}