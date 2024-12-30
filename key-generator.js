const crypto = require("crypto");

// Function to generate a random string of specified length
function generateRandomString(length) {
  return crypto.randomBytes(length).toString("base64url");
}

// Generate a 64-byte long random string for SECRET_KEY_BASE
const secretKeyBase = generateRandomString(64);

// Generate a 32-byte long random string for SIGNING_SALT and ENCRYPTION_SALT
const signingSalt = generateRandomString(32);
const encryptionSalt = generateRandomString(32);

console.log("SECRET_KEY_BASE:", secretKeyBase);
console.log("SIGNING_SALT:", signingSalt);
console.log("ENCRYPTION_SALT:", encryptionSalt);
