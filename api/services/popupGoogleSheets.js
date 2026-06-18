import { google } from "googleapis";

const getAuth = () => {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
};

const auth = getAuth();

const appendPopupLead = async (data) => {
  try {
    const client = await auth.getClient();

    const googleSheets = google.sheets({
      version: "v4",
      auth: client,
    });

    const values = [[
      data.fullName,
      data.email,
      data.businessStage,
      data.biggestChallenge || "Not provided",
      new Date().toLocaleString(),
    ]];

    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId: process.env.POPUP_SPREADSHEET_ID,
      range: "Sheet1!A:E",
      valueInputOption: "USER_ENTERED",
      resource: {
        values,
      },
    });

    console.log("✅ Popup lead added to Google Sheet");
  } catch (error) {
    console.error("❌ Popup Google Sheets Error:", error.message);
    throw new Error("Failed to save popup lead to spreadsheet", { cause: error });
  }
};

export default appendPopupLead;
