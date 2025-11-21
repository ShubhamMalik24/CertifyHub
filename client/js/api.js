// Central API setup
const API_BASE = "http://localhost:5000/api";

// Helper function for authenticated requests
async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

