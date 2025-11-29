import { auth } from "./firebase";

// Get the base URL from the environment variable (127.0.0.1:5000)
const API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_API_BASE_URL || 'http://127.0.0.1:5000';

/**
 * Executes a secure, authenticated API request to the Flask backend.
 */
export async function secureApiCall(endpoint: string, method: string = 'GET', data: any = null) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication error: User not logged in.");
  }

  // 1. Get the Firebase ID Token (JWT)
  const token = await user.getIdToken();

  // 2. Build the request options
  const url = `${API_BASE_URL}/api${endpoint}`;
  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method: method,
    headers: headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  // 3. Execute the fetch request
  const response = await fetch(url, options);

  // 4. Handle HTTP errors
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'API call failed' }));
    throw new Error(`API Error ${response.status}: ${errorBody.error || errorBody.message}`);
  }

  // 5. Return JSON response (or null for 204 No Content)
  if (response.status === 204 || response.status === 200 && method === 'DELETE') {
     return null;
  }
  return response.json();
}