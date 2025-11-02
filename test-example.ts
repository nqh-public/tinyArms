// Example file with potential constitutional violations

function validateEmail(email: string): boolean {
  // Custom email validation (could use validator.js)
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateUsername(username: string): boolean {
  // Duplicate validation pattern
  const regex = /^[a-zA-Z0-9_]{3,20}$/;
  return regex.test(username);
}

function validatePassword(password: string): boolean {
  // Another duplicate pattern
  const regex = /^.{8,}$/;
  return regex.test(password);
}

// Hardcoded environment-specific config
const API_URL = "https://api.example.com";
const DB_HOST = "localhost:5432";
