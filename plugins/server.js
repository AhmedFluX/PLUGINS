const { cmd } = require('../command');
const axios = require('axios');
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;
const BASE_URL = 'https://ahmed-md.vercel.app';
console.log("✅ AHMED-MD PAIR LOADED");

async function getServers() {
  try {
    const r = await axios.get(`${BASE_URL}/servers`, { timeout: 10000 });
    return r.data.servers || [];
  } catch (e) { return []; }
}

// ─── STATUS ───
cmd({
  pattern: "status",
  react: "📊",
  desc: "Check servers",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const servers = await getServers();
    if (!servers.length) return reply(`No servers found!${FOOTER}`);
    let msg = `*AHMED-MD SERVER STATUS*\n\nTotal Servers: ${servers.length}\n\n`;
    for (let s of servers) {
      try {
        const r = await axios.get(`${s.url}/active`, { timeout: 5000 });
        msg += `${s.name}: ${r.data.count || 0}/${r.data.limit || 50} 🟢 ONLINE\n`;
      } catch (e) { msg += `${s.name}: 🔴 OFFLINE\n`; }
    }
    await reply(msg + FOOTER);
  } catch (e) { await reply(`Error!${FOOTER}`); }
});

// ─── PAIR ───
cmd({
  pattern: "pair",
  react: "✅",
  desc: "Get pairing code",
  category: "owner",
  use: ".pair 923001234567",
  filename: __filename
}, async (conn, mek, m, { from, args, senderNumber, reply }) => {
  try {
    let num = args[0] ? args[0].replace(/[^0-9]/g, '') : senderNumber;
    if (!num || num.length < 10) return reply(`Example: .pair 923001234567${FOOTER}`);
    
    let servers = await getServers();
    if (!servers.length) return reply(`No servers available!${FOOTER}`);
    
    let code = null;
    let usedServer = servers[0].name;
    // 3 servers try karo
    for (let srv of servers.slice(0, 3)) {
      try {
        const r1 = await axios.get(`${srv.url}/api/pair`, { params: { number: num }, timeout: 20000 });
        if (r1.data && r1.data.code) { code = r1.data.code; usedServer = srv.name; break; }
      } catch (e) {}
      try {
        const r2 = await axios.get(`${srv.url}/code`, { params: { number: num }, timeout: 20000 });
        if (r2.data && r2.data.code) { code = r2.data.code; usedServer = srv.name; break; }
      } catch (e) {}
    }
    if (!code) return reply(`Failed! All servers busy, 1 min baad try karo.${FOOTER}`);
    await reply(`*AHMED-MD PAIRING CODE*\n\nYour pairing code is: ${code}\n\n*Server:* ${usedServer}\nWhatsApp > Linked Devices > Link with phone number${FOOTER}`);
    await reply(code);
  } catch (e) {
    console.log("PAIR ERROR:", e.message);
    await reply(`Error! Try again.${FOOTER}`);
  }
});

// ─── CHREACT ───
cmd({
  pattern: "chreact",
  react: "🎯",
  desc: "React to channel post",
  category: "group",
  use: ".chreact <url> [emojis]",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) return reply(`Example:\n.chreact https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J/123 ❤️,👍,🔥${FOOTER}`);
    const url = args[0].trim();
    const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
    if (!match) return reply(`Invalid URL!${FOOTER}`);
    let emojis = ['❤️', '👍', '🔥'];
    if (args.length > 1) {
      let p = args.slice(1).join(' ').split(',').map(x => x.trim()).filter(x => x);
      if (p.length) emojis = p;
    }
    let ok = false;
    try { await axios.get(`${BASE_URL}/react`, { params: { url, emojis: emojis.join(',') }, timeout: 15000 }); ok = true; } catch (e) {}
    if (!ok) {
      try { await axios.get(`${BASE_URL}/api/react`, { params: { url, emojis: emojis.join(',') }, timeout: 15000 }); ok = true; } catch (e) {}
    }
    if (!ok) return reply(`Failed! Server offline hai.${FOOTER}`);
    await reply(`Reactions sent successfully!\n\nChannel: ${match[1]}\nPost: ${match[2]}\nEmojis: ${emojis.join(' ')}${FOOTER}`);
  } catch (e) { await reply(`Error!${FOOTER}`); }
});
