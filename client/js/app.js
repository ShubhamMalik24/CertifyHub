// Navbar elements
const loginLink = document.getElementById("login-link");
const logoutBtn = document.getElementById("logout-btn");
const profileLink = document.getElementById("profile-link");
const instructorLink = document.getElementById("instructor-link");

// Check if user is logged in
const checkAuth = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    // Not logged in
    loginLink.style.display = "inline-block";
    logoutBtn.style.display = "none";
    profileLink.style.display = "none";
    instructorLink.style.display = "none";
    return;
  }

  try {
    const user = await apiRequest("/auth/me", "GET", null, true);

    // Logged in
    loginLink.style.display = "none";
    logoutBtn.style.display = "inline-block";
    profileLink.style.display = "inline-block";

    // Show instructor dashboard link only if role = instructor
    if (user.role === "instructor") {
      instructorLink.style.display = "inline-block";
    } else {
      instructorLink.style.display = "none";
    }
  } catch (err) {
    console.error("Auth check failed:", err);
    localStorage.removeItem("token"); // clear bad token
    loginLink.style.display = "inline-block";
    logoutBtn.style.display = "none";
    profileLink.style.display = "none";
    instructorLink.style.display = "none";
  }
};

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  alert("✅ Logged out successfully!");
  window.location.href = "home.html";
});

// Run auth check on load
document.addEventListener("DOMContentLoaded", checkAuth);