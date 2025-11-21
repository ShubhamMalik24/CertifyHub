function isStrongPassword(password) {
  // Password must be at least 8 characters long
  // Must contain at least one uppercase letter, one lowercase letter, one digit, and one special character
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return strongPasswordRegex.test(password);
}

module.exports = { isStrongPassword };
