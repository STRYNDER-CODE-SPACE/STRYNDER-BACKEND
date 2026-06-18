import dotenv from "dotenv";
dotenv.config();
import express from "express";
import axios from "axios";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import appendToSheet from "./services/googleSheets.js";
import sendEmails from "./services/sendEmail.js";
import appendPopupLead from "./services/popupGoogleSheets.js";
import sendPopupEmail from "./services/sendPopUpEmail.js";

const app = express();

// =========================
// CORS — must be first to handle preflight OPTIONS
// =========================
const allowedOrigins = [
  "https://lively-rabanadas-5f4f57.netlify.app",
  "https://strynder.com",
];

if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173");
}

// Manual CORS middleware — handles both preflight (OPTIONS) and regular requests
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // If the request origin is in our allowed list, echo it back
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  // Handle preflight OPTIONS requests — respond 200 immediately
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// =========================
// SECURITY MIDDLEWARE
// =========================
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// =========================
// RATE LIMITING
// =========================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many inquiries. Please try again later.",
  },
});

app.use(generalLimiter);

// =========================
// HELPERS
// =========================
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && emailRegex.test(email);
};

// =========================
// ROUTES
// =========================

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Strynder API is running" });
});

// -------------------------
// NEWSLETTER SUBSCRIBE
// -------------------------
app.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  const { API_KEY, AUDIENCE_ID, MAILCHIMP_SERVER_PREFIX } = process.env;

  if (!API_KEY || !AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
    console.error("❌ Mailchimp environment variables are not configured");
    return res.status(500).json({
      success: false,
      message: "Newsletter signup is temporarily unavailable. Please try again later.",
    });
  }

  try {
    const response = await axios.post(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
      {
        email_address: email,
        status: "subscribed",
      },
      {
        headers: {
          Authorization: `apikey ${API_KEY}`,
        },
      }
    );

    console.log("✅ Email added to Mailchimp:", response.data.id);
    return res.status(200).json({
      success: true,
      message: "You've been subscribed to the newsletter!",
    });
  } catch (error) {
    console.error("❌ Mailchimp Error:", error.response?.data || error.message);

    if (error.response) {
      const { title } = error.response.data;
      if (title === "Member Exists") {
        return res.status(200).json({
          success: true,
          message: "You're already subscribed to the newsletter.",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to subscribe. Please try again or contact us directly.",
    });
  }
});

// -------------------------
// PROJECT INQUIRY
// -------------------------
app.post("/submit-inquiry", inquiryLimiter, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      businessName,
      projectType,
      projectDescription,
      timeline,
      budget,
    } = req.body;

    // --- Validation ---
    const missingFields = [];
    if (!fullName?.trim()) missingFields.push("fullName");
    if (!email?.trim()) missingFields.push("email");
    if (!projectType?.trim()) missingFields.push("projectType");
    if (!projectDescription?.trim()) missingFields.push("projectDescription");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in all required fields: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // --- Save to Google Sheets ---
    await appendToSheet([
      fullName.trim(),
      email.trim().toLowerCase(),
      phone?.trim() || "Not provided",
      businessName?.trim() || "Not provided",
      projectType.trim(),
      projectDescription.trim(),
      timeline?.trim() || "Not specified",
      budget?.trim() || "Not specified",
      new Date().toLocaleString(),
    ]);

    // --- Send Emails ---
    await sendEmails(req.body);

    return res.status(200).json({
      success: true,
      message:
        "Your inquiry has been submitted successfully! Check your email for next steps.",
    });
  } catch (error) {
    console.error("❌ Inquiry Error:", error.message);
    return res.status(500).json({
      success: false,
      message:
        "We couldn't process your inquiry right now. Please try again or email us at strynderhelp@gmail.com",
    });
  }
});

// -------------------------
// POPUP LEAD
// -------------------------
app.post("/popup-lead", inquiryLimiter, async (req, res) => {
  try {
    const { fullName, email, businessStage } = req.body;

    if (!fullName?.trim() || !email?.trim() || !businessStage?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    await appendPopupLead(req.body);
    await sendPopupEmail(req.body);

    return res.status(200).json({
      success: true,
      message: "Thanks for your interest! Check your email for next steps.",
    });
  } catch (error) {
    console.error("❌ Popup Lead Error:", error.message);
    if (error.cause) {
      console.error("Caused by:", error.cause.message);
      if (error.cause.response) {
        console.error("Response data:", error.cause.response.data);
      }
    }
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong. Please try again or reach out to us directly.",
    });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000;

// Only bind to a port when running locally — Vercel manages the HTTP layer
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
