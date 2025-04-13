import * as SecureStore from "expo-secure-store";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// OK
export async function getUserData() {
    const authToken = await SecureStore.getItemAsync('authToken');

    if (!authToken) {
        return {};
    }

    try {
        console.log(`authToken`, authToken);
        const response = await fetch(`${API_BASE_URL}/private/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log(`response.status`, response.status);
        console.log(`response.ok`, response.ok);
        console.log(`response.headers`, response.headers);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.log(`Error fetching user data: ${error}`);
        return {};
    }
}

export async function updateUser(username, email, oldPassword, newPassword) {
    
    const authToken = await SecureStore.getItemAsync('authToken');

    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/private/user`, {
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

/// TODELETE 
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

// TODO :à tester
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

// TODO :à tester
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


// TODO :à tester
export async function deleteProfile() {
    const authToken = await SecureStore.getItemAsync('authToken');


    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/private/user`, {
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

// Update User Location : /private/user/location

// TODO :à tester
export async function updateUserLocation(latitude, longitude) {
    const authToken = await SecureStore.getItemAsync('authToken');

    if (!authToken) {
        return {};
    }

    const response = await fetch(`${API_BASE_URL}/private/user/location`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body : JSON.stringify({
            location: {
                latitude,
                longitude
            }
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

// Set User profile image : /private/user/profile-image

// TODO :à tester
export async function setUserProfileImage(imageFile) {

    const { authToken } = await getAuthenticatedUser();

    if (!authToken) {
        return {};
    }

    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${API_BASE_URL}/private/user/profile-image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    // message de succès : Profile image successfully updated! Your new profile picture is now visible to other users.
    // sinon erreur

    if (text) {
        const data = JSON.parse(text);
        if (data.message) {
            return data.message;
        } else {
            return data.error || 'Unknown error occurred.';
        }
    }
}