const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await apiRequest("/auth/login", "POST", { email, password });
    saveToken(data.token);

    alert("✅ Login successful!");
    window.location.href = "home.html";
  } catch (err) {
    alert("❌ Login failed. Check your credentials.");
    console.error(err);
  }
});