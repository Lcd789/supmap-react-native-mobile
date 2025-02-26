const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function verifyEmail(token) {

    const response = await fetch(`${API_BASE_URL}/auth/confirm-email?token=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};

}

export async function sendValidationEmailAgain(email) {
    const response = await fetch(`${API_BASE_URL}/auth/resend-confirmation-email`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email}),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email}),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function login(username, password) {
    const response = await fetch("https://supmap-api.up.railway.app/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        redirect: "follow",
    });

    if (!response.ok) {
        let errorMessage = "Une erreur est survenue.";

        switch (response.status) {
            case 404:
                errorMessage = "Utilisateur ou mot de passe incorrect.";
                break;
            case 409:
                errorMessage = "Veuillez valider votre mail.";
                break;
            default:
                try {
                    const errorResponse = await response.json(); 
                    errorMessage = errorResponse.message || `Erreur HTTP ${response.status}`;
                } catch {
                    errorMessage = `Erreur HTTP ${response.status}`;
                }
        }

        throw new Error(errorMessage);
    }

    return await response.text();
}


export async function register(username, email, password) {
    const response = await fetch(`https://supmap-api.up.railway.app/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

export async function resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}