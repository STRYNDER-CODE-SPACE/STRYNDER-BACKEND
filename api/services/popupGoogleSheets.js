import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const appendPopupLead = async (data) => {

  const client = await auth.getClient();

  const googleSheets = google.sheets({
    version: "v4",
    auth: client,
  });

  const values = [[
    data.fullName,
    data.email,
    data.businessStage,
    data.biggestChallenge,
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
};

export default appendPopupLead;