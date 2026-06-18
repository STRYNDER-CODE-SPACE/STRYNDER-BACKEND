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

const appendToSheet = async (data) => {
  try {

    const auth = getAuth();

    const sheets = google.sheets({
      version: "v4",
      auth,
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Sheet1!A:I",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [data],
      },
    });

    console.log("✅ Data added to Google Sheet");

  } catch (error) {

    console.error("❌ Google Sheets Error:", error.message);
    throw error;
  }
};

export default appendToSheet;