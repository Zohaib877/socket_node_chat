import admin from "firebase-admin";
import apn from "apn";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = path.resolve(
  __dirname,
  "../transtant-firebase.json"
);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendFCMNotification = async (deviceToken, message) => {
  try {
    const fcmMessage = {
      token: deviceToken,
      // notification: {
      //     title: message.title || "New Message",
      //     body: message.body || "",
      // },
      // data: message.data || {},
      data: {
        title: message.title || "New Message",
        body: message.body || "",
        type: message.type || "incoming_call",
        ...message.data,
      },
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: message.title || "New Message",
              body: message.body || "",
            },
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().send(fcmMessage);
      return response;
    } catch (error) {
      if (error.code === "messaging/registration-token-not-registered") {
        console.warn(`Invalid token, deleting: ${deviceToken}`);
      } else {
        console.error("FCM error:", error);
      }
    }
    // const response = await admin.messaging().send(fcmMessage);

    // console.log("VIOP Response:", response);

    // return response;
  } catch (error) {
    console.error("VIOP Error:", error);
    throw error;
  }
};

const apnProvider = new apn.Provider({
  token: {
    key: path.resolve(__dirname, "../AuthKey_Z9Q744FAA6.p8"),
    keyId: process.env.APN_KEY_ID,
    teamId: process.env.APN_TEAM_ID,
  },
  production: false, // Use true for production mode
});

const sendAPNSNotification = async (deviceToken, message) => {
  // Create a new APNs notification instance
  const apnNotification = new apn.Notification();

  // Set alert message, body, and payload structure as per APNs requirements
  apnNotification.aps = {
    alert: {
      title: message.title,
      body: message.body,
    },
    "content-available": 1, // Set for background notifications if applicable
  };

  apnNotification.topic = "com.cmold.Transtant.voip"; // Replace with your actual bundle ID
  apnNotification.payload = message.data || {};

  const result = await apnProvider.send(apnNotification, deviceToken);
  if (result.failed.length) {
    console.error("APNs Error:", result.failed);
  } else {
    console.log("APNs Response:", result.sent);
  }
  return result;
};

export { sendFCMNotification, sendAPNSNotification };
