/**
 * Load Telebirr config from telebirr.credentials (not *.env) so Prisma CLI does not
 * parse PEM material when running db push / migrate under backend/.
 */
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const credentialsPath = path.join(__dirname, "telebirr.credentials");
const legacySecretsPath = path.join(__dirname, "secrets.env");
const legacyEnvPath = path.join(__dirname, ".env");

if (fs.existsSync(credentialsPath)) {
  dotenv.config({ path: credentialsPath });
} else if (fs.existsSync(legacySecretsPath)) {
  dotenv.config({ path: legacySecretsPath });
} else if (fs.existsSync(legacyEnvPath)) {
  dotenv.config({ path: legacyEnvPath });
}
