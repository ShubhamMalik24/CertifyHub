const form = document.getElementById("create-course-form");
const myCoursesList = document.getElementById("myCoursesList");

// Handle course creation
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const category = document.getElementById("category").value;
  const price = document.getElementById("price").value;

  try {
    await apiRequest(
      "/courses",
      "POST",
      { title, description, category, price, modules: [] },
      true
    );

    alert("✅ Course created successfully!");
    fetchMyCourses();
    form.reset();
  } catch (err) {
    alert("❌ Failed to create course. Make sure you're logged in as instructor.");
    console.error(err);
  }
});

// Fetch instructor’s courses
const fetchMyCourses = async () => {
  try {
    const courses = await apiRequest("/courses", "GET", null, true);

    myCoursesList.innerHTML = "";
    courses.forEach((course) => {
      const div = document.createElement("div");
      div.classList.add("course-card");
      div.innerHTML = `
        <h4>${course.title}</h4>
        <p>${course.description.substring(0, 100)}...</p>
        <p>Price: ${course.price === 0 ? "Free" : "$" + course.price}</p>
      `;
      myCoursesList.appendChild(div);
    });
  } catch (err) {
    console.error("❌ Error fetching courses:", err);
  }
};

// Initial load
fetchMyCourses();