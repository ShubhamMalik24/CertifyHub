const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  try {
    const data = await apiRequest("/auth/register", "POST", {
      name,
      email,
      password,
      role,
    });

    saveToken(data.token);

    alert("✅ Registration successful!");
    window.location.href = "home.html";
  } catch (err) {
    alert("❌ Registration failed.");
    console.error(err);
  }
});