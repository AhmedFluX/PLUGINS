// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Command: mediafire
//  Category: download
// ═══════════════════════════════════
const axios = require("axios");
const { cmd } = require("../command");

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "mediafire",
  alias: ["mfire", "mf"],
  react: '📥',
  desc: "Download any file from MediaFire",
  category: "download",
  use: ".mediafire <MediaFire URL>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args, prefix }) => {
  try {
    const url = args.join(" ").trim();
    if (!url || !url.includes("mediafire.com")) {
      return reply(`Please provide a valid MediaFire URL\nExample: ${prefix}mediafire https://www.mediafire.com/file/abc/file.zip${FOOTER}`);
    }

    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
    const loading = await conn.sendMessage(from, { text: `Downloading from MediaFire...\n[▱▱▱▱▱▱▱▱▱▱] 0%` }, { quoted: mek });
    const loadKey = loading.key;

    let fileName = null;
    let downloadUrl = null;

    // API 1
    try {
      const api1 = `https://api.deline.web.id/downloader/mediafire?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api1, { timeout: 15000 });
      if (data?.status && data?.result?.downloadUrl) {
        fileName = data.result.fileName;
        downloadUrl = data.result.downloadUrl;
      }
    } catch (e) { console.log("AHMED-MD API 1 Failed:", e.message); }

    // API 2 - BACKUP
    if (!downloadUrl) {
      try {
        await conn.sendMessage(from, { text: `Trying backup server...\n[▰▰▰▱▱▱▱▱▱▱] 30%`, edit: loadKey });
        const api2 = `https://api.vreden.my.id/api/mediafire?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(api2, { timeout: 15000 });
        if (data?.result?.link) {
          fileName = data.result.filename || data.result.name || "mediafire_file";
          downloadUrl = data.result.link;
        }
      } catch (e) { console.log("AHMED-MD API 2 Failed:", e.message); }
    }

    // API 3 - BACKUP 2
    if (!downloadUrl) {
      try {
        const api3 = `https://api.zenzxz.my.id/api/downloader/mediafire?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(api3, { timeout: 15000 });
        if (data?.result?.download) {
          fileName = data.result.filename;
          downloadUrl = data.result.download;
        }
      } catch (e) { console.log("AHMED-MD API 3 Failed:", e.message); }
    }

    if (!downloadUrl || !fileName) {
      await conn.sendMessage(from, { text: `Failed to fetch file. Invalid URL or all servers are down. Try again later.${FOOTER}`, edit: loadKey });
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return;
    }

    await conn.sendMessage(from, { text: `File found: ${fileName}\nDownloading...\n[▰▰▰▰▰▰▱▱▱▱] 60%`, edit: loadKey });

    const fileResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 120000, maxContentLength: 150 * 1024 * 1024 });
    const fileBuffer = Buffer.from(fileResponse.data);
    const sizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

    if (fileBuffer.length > 100 * 1024 * 1024) {
      await conn.sendMessage(from, {
        text: `*File is too large to send on WhatsApp!*\n\nFile: ${fileName}\nSize: ${sizeMB} MB\n\nDownload directly from here:\n${downloadUrl}${FOOTER}`,
        edit: loadKey
      });
      return;
    }

    const ext = fileName.split('.').pop().toLowerCase();
    const mimeMap = {
      mp4: 'video/mp4', mkv: 'video/x-matroska', mov: 'video/quicktime',
      mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
      apk: 'application/vnd.android.package-archive',
      zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
      pdf: 'application/pdf', doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain', js: 'text/javascript', json: 'application/json',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    const mimetype = mimeMap[ext] || 'application/octet-stream';

    await conn.sendMessage(from, { text: `Uploading to WhatsApp...\n[▰▰▰▰▰▰▰▰▰▱] 90%`, edit: loadKey });

    await conn.sendMessage(from, {
      document: fileBuffer,
      fileName: fileName,
      mimetype: mimetype,
      caption: `*MediaFire Download*\n\nFile: ${fileName}\nSize: ${sizeMB} MB${FOOTER}`
    }, { quoted: mek });

    await conn.sendMessage(from, { text: `*Download Complete!*\nFile: ${fileName}${FOOTER}`, edit: loadKey });
    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (error) {
    console.error("AHMED-MD MediaFire Error:", error);
    await reply(`Failed to download file. Please check the URL or try again later.${FOOTER}`);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
  }
});
