const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS or default env which apparently isn't working... wait!
}
