async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await apiRequest("/auth/login", "POST", { email, password });
    localStorage.setItem("user", JSON.stringify(data));
    alert("Login successful!");
    window.location.href = "home.html"; // redirect after login
  } catch (err) {
    alert("Login failed!");
    console.error(err);
  }
}