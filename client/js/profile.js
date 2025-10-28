document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await apiRequest("/auth/me", "GET", null, true);

    document.getElementById("name").textContent = user.name;
    document.getElementById("email").textContent = user.email;

    const courseList = document.getElementById("enrolled-courses");
    if (user.enrolledCourses && user.enrolledCourses.length > 0) {
      user.enrolledCourses.forEach((course) => {
        const li = document.createElement("li");
        li.textContent = course.title;
        courseList.appendChild(li);
      });
    } else {
      courseList.innerHTML = "<li>No enrolled courses yet.</li>";
    }
  } catch (err) {
    alert("❌ Failed to load profile. Please login.");
    window.location.href = "Login.html";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "Login.html";
});