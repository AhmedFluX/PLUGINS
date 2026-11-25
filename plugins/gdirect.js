const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

function getMime(ext) {
  ext = ext.toLowerCase();
  if (['mp4','mkv','mov','webm'].includes(ext)) return 'video/mp4';
  if (['mp3','ogg','wav','m4a'].includes(ext)) return 'audio/mpeg';
  if (['jpg','jpeg','png','webp'].includes(ext)) return 'image/jpeg';
  if (['pdf'].includes(ext)) return 'application/pdf';
  if (['zip','rar'].includes(ext)) return 'application/zip';
  if (['apk'].includes(ext)) return 'application/vnd.android.package-archive';
  return 'application/octet-stream';
}

cmd({
  pattern: "gdirect",
  alias: ["gdrive", "gd"],
  react: "📥",
  desc: "Download file from Google Drive direct link",
  category: "downloader",
  use: ".gdirect <google drive link>",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let driveLink = m.body.replace(/^\.gdirect\s*/i, '').replace(/^\.gdrive\s*/i, '').replace(/^\.gd\s*/i, '').trim();
    if (!driveLink) return reply(`❌ *Usage:* \`.gdirect <google drive link>\`\n\nExample:\n.gdirect https://drive.google.com/file/d/1ABC.../view${FOOTER}`);

    await reply(`*📥 Downloading file...*${FOOTER}`);

    // 🔍 File ID Nikalo - Har tarah ke link se
    let fileId = null;
    let idMatch = driveLink.match(/\/d\/([-\w]{25,})/); // /d/ID/view wala
    if (idMatch) fileId = idMatch[1];
    else {
      let idParam = driveLink.match(/[?&]id=([-\w]{25,})/);
      if (idParam) fileId = idParam[1];
      else {
        let any = driveLink.match(/[-\w]{25,}/);
        if (any) fileId = any[0];
      }
    }

    if (!fileId) return reply(`❌ *Invalid Google Drive link!*${FOOTER}`);

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // 🌍 File Info
    const headResponse = await axios.head(downloadUrl, { validateStatus: () => true, maxRedirects: 5 });
    let contentLength = parseInt(headResponse.headers['content-length'] || '0', 10);

    if (contentLength > MAX_FILE_SIZE) {
      return reply(`❌ *File size exceeds 2GB limit! (${(contentLength / (1024*1024*1024)).toFixed(2)} GB)*${FOOTER}`);
    }

    let fileName = `file_${fileId}`;
    let disp = headResponse.headers['content-disposition'];
    if (disp) {
      let fn = disp.match(/filename\*=UTF-8''(.+)|filename="?([^"]+)"?/);
      if (fn) fileName = decodeURIComponent(fn[1] || fn[2] || fileName).replace(/['"]/g, '');
    }

    let fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    let fileSize = contentLength > 0 ? (contentLength / (1024*1024)).toFixed(2) : 'Unknown';

    // 📥 Download
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      maxContentLength: MAX_FILE_SIZE,
      maxBodyLength: MAX_FILE_SIZE,
    });

    if (!response.data || response.data.byteLength < 1000) {
      return reply(`❌ *File download nahi hui! Link public hai?*\n\nDrive me ja ke Share > Anyone with link > Viewer karo.${FOOTER}`);
    }

    const caption = `*${fileName}*\n\n*${fileSize} MB*${FOOTER}`;

    // 📤 Send as Document - Sab file ke liye sahi
    await conn.sendMessage(from, {
      document: Buffer.from(response.data),
      mimetype: getMime(fileExtension),
      fileName: fileName,
      caption: caption
    }, { quoted: mek });

    await reply(`*✅ File sent successfully!*${FOOTER}`);

  } catch (e) {
    console.log("GDIRECT ERROR:", e.message);
    await reply(`🚨 *Error occurred! Check the link and try again.*\n\nLink public hona chahiye: Drive > Share > Anyone with link${FOOTER}`);
  }
}); 
