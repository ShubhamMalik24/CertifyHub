const API_BASE = "http://localhost:5000/api";

async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
  const headers = {};

  // Only set Content-Type to application/json if body is not FormData
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : null),
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    // Handle standardized error responses
    throw new Error(data.message || `API Error: ${res.status}`);
  }

  // Handle standardized success responses
  if (data.success !== undefined) {
    return data.data || data; // Return data field for new format, full response for old format
  }

  return data; // Return as-is for non-standardized responses
}

export default apiRequest;
