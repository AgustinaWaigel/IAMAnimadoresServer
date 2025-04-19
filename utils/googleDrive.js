const { google } = require("googleapis");
const fs = require("fs");

// Nueva forma: Autenticación con variables de entorno
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ["https://www.googleapis.com/auth/drive"]
);

const drive = google.drive({ version: "v3", auth });

// Y todo lo demás igual...
async function uploadFileToDrive(filePath, fileName, mimeType) {
  const fileMetadata = {
    name: fileName,
    parents: [process.env.GOOGLE_FOLDER_ID], // 👈 y también folder_id configurable
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, webViewLink, webContentLink",
  });

  const uploadedFileId = response.data.id;

  await drive.permissions.create({
    fileId: uploadedFileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const file = await drive.files.get({
    fileId: uploadedFileId,
    fields: "webViewLink, webContentLink",
  });

  return file.data;
}

module.exports = { uploadFileToDrive };
