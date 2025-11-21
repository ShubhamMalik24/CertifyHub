// Elements
const coursesList = document.getElementById("coursesList");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");

// Fetch all courses
const fetchCourses = async (query = "", filter = "") => {
  try {
    let url = `/courses`;
    const params = [];
    if (query) params.push(`search=${encodeURIComponent(query)}`);
    if (filter) params.push(`filter=${filter}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const courses = await apiRequest(url, "GET");

    coursesList.innerHTML = "";
    if (courses.length === 0) {
      coursesList.innerHTML = "<p>No courses found.</p>";
      return;
    }

    courses.forEach((course) => {
      const div = document.createElement("div");
      div.classList.add("course-card");
      div.innerHTML = `
        <h3>${course.title}</h3>
        <p>${course.description.substring(0, 100)}...</p>
        <p>Category: ${course.category}</p>
        <p>Price: ${course.price === 0 ? "Free" : "$" + course.price}</p>
        <button onclick="enrollCourse('${course._id}')">Enroll</button>
      `;
      coursesList.appendChild(div);
    });
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
    coursesList.innerHTML = "<p>Error loading courses.</p>";
  }
};

// Enroll in a course
const enrollCourse = async (courseId) => {
  try {
    await apiRequest(`/courses/${courseId}/enroll`, "POST", null, true);
    alert("✅ Enrolled successfully!");
  } catch (err) {
    alert("❌ Failed to enroll. Please login.");
    console.error(err);
  }
};

// Event listeners
searchInput.addEventListener("input", () =>
  fetchCourses(searchInput.value, filterSelect.value)
);
filterSelect.addEventListener("change", () =>
  fetchCourses(searchInput.value, filterSelect.value)
);

// Initial load
fetchCourses();