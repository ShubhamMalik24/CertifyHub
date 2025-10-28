const checkoutForm = document.getElementById("checkoutForm");

// Handle checkout
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const courseId = document.getElementById("courseId").value;
  const paymentMethod = document.getElementById("paymentMethod").value;

  try {
    const data = await apiRequest(
      `/courses/${courseId}/checkout`,
      "POST",
      { paymentMethod },
      true
    );

    if (data.success) {
      alert("✅ Payment successful! You are now enrolled.");
      window.location.href = "profile.html";
    } else {
      alert("❌ Payment failed. Try again.");
    }
  } catch (err) {
    alert("❌ Checkout error. Please login and try again.");
    console.error(err);
  }
});