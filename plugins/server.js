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
});app.com/channel/0029Vb5dDVO59PwTnL86j13J ❤️,👍,🔥
`);
        }
        
        const url = args[0];
        
        if (!isValidChannelPostUrl(url)) {
            return reply(`❌ *Invalid URL!*

*Valid format:* 
https://whatsapp.com/channel/CHANNEL_ID/POST_ID

*Example:* 
https://whatsapp.com/channel/0029Vb5dDVO59PwTnL86j13J
`);
        }
        
        const ids = extractIdsFromUrl(url);
        if (!ids) {
            return reply(`❌ *Failed to extract channel/post IDs from URL!*`);
        }
        
        let emojis = [];
        let emojisString = '';
        
        if (args.length > 1) {
            const remaining = args.slice(1).join(' ');
            emojis = parseEmojis(remaining);
            emojisString = emojis.join(',');
        }
        
        if (!emojisString) {
            emojis = ['❤️', '👍', '🔥'];
            emojisString = emojis.join(',');
        }
        
        const validation = validateEmojis(emojis);
        if (!validation.valid) {
            return reply(validation.error);
        }
        
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });
        
        // Send reaction to single API endpoint
        const reactUrl = `${BASE_URL}/react?url=${encodeURIComponent(url)}&emojis=${encodeURIComponent(emojisString)}`;
        
        try {
            await axios.get(reactUrl, { timeout: 10000 });
        } catch (error) {
            console.error("React API error:", error);
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(`❌ *Failed to send reactions!*\n\n*Error:* ${error.message}`);
        }
        
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
// ═════════════════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Commands: pair (30 Servers) + status + chreact
//  Category: owner / group
//  Server: https://ahmed-md.vercel.app
// ═════════════════════════════════════════════
const { cmd } = require('../command');
const axios = require('axios');
const { lidToPhone } = require('../lib/functions');

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;
const BASE_URL = 'https://ahmed-md.vercel.app';

// ─── 30 SERVERS KI LIST LAO ───
async function getServers() {
  try {
    const res = await axios.get(`${BASE_URL}/servers`, { timeout: 10000 });
    if (res.data && res.data.servers) return res.data.servers;
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (e) {
    console.error("AHMED-MD GetServers Error:", e.message);
    return [];
  }
}

// ─── SAB SE KHAALI SERVER DHUNDO ───
async function getBestServer(servers) {
  let best = null;
  let bestCount = 999;
  for (let s of servers) {
    try {
      const res = await axios.get(`${s.url}/active`, { timeout: 5000 });
      let count = res.data?.count || 0;
      let limit = res.data?.limit || 50;
      if (count >= limit) continue; // Full skip
      if (count < bestCount) { bestCount = count; best = s; }
    } catch (e) {
      if (!best) best = s; // Offline bhi backup ke liye rakh lo
    }
  }
  return best;
}

function getCountStatus(count) {
  if (count === 50) return '🔴';
  if (count >= 40) return '🟣';
  if (count >= 30) return '🟡';
  if (count >= 20) return '🟠';
  if (count >= 10) return '🔵';
  return '🟢';
}

function isValidChannelPostUrl(url) {
  const pattern = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/[a-zA-Z0-9]+\/\d+$/;
  return pattern.test(url);
}

function extractIdsFromUrl(url) {
  const match = url.match(/\/channel\/([a-zA-Z0-9]+)\/(\d+)/);
  if (match) return { channelId: match[1], postId: match[2] };
  return null;
}

function parseEmojis(input) {
  let emojis = [];
  const parts = input.split(',').map(p => p.trim()).filter(p => p);
  for (const part of parts) {
    if (/[\p{Emoji}\u200d]/u.test(part)) emojis.push(part);
  }
  return emojis;
}

// ==================== 1. STATUS - 30 SERVERS ====================
cmd({
  pattern: "status",
  alias: ["serverstatus", "stats", "servers"],
  react: "📊",
  desc: "Check 30 servers status",
  category: "owner",
  use: ".status",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
    const servers = await getServers();
    if (!servers || servers.length === 0) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(`Failed to fetch server list. Main server offline hai.${FOOTER}`);
    }

    let totalActive = 0, totalLimit = 0, online = 0, offline = 0;
    let lines = [];

    for (let s of servers) {
      try {
        const res = await axios.get(`${s.url}/active`, { timeout: 6000 });
        let count = res.data?.count || 0;
        let limit = res.data?.limit || 50;
        totalActive += count; totalLimit += limit; online++;
        lines.push(`${s.name}: ${count}/${limit} ${getCountStatus(count)} ONLINE`);
      } catch (e) {
        offline++; lines.push(`${s.name}: 0/50 🔴 OFFLINE`);
      }
    }

    await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    let msg = `*AHMED-MD SERVER STATUS*\n\n`;
    msg += `*Overview*\nTotal Servers: ${servers.length}\nOnline: ${online} | Offline: ${offline}\nActive Users: ${totalActive}/${totalLimit}\n\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += lines.join('\n');
    msg += FOOTER;
    await reply(msg);

  } catch (e) {
    console.error("AHMED-MD Status Error:", e);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    await reply(`Error checking server status.${FOOTER}`);
  }
});

// ==================== 2. PAIR - 30 SERVERS ====================
cmd({
  pattern: "pair",
  alias: ["getpair", "clonebot", "getcode"],
  react: "✅",
  desc: "Get pairing code for AHMED-MD (30 Servers)",
  category: "owner",
  use: ".pair 923001234567",
  filename: __filename
}, async (conn, mek, m, { from, args, sender, senderNumber, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    let phoneNumber;
    if (args[0]) {
      phoneNumber = args[0].trim().replace(/[^0-9]/g, '');
    } else {
      if (sender.includes('@lid')) {
        try {
          const converted = await lidToPhone(conn, sender);
          phoneNumber = converted ? converted.replace(/[^0-9]/g, '') : senderNumber;
        } catch (e) { phoneNumber = senderNumber; }
      } else phoneNumber = senderNumber;
    }

    if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(`Please provide a valid phone number without +\nExample: .pair 923001234567${FOOTER}`);
    }

    // STEP 1: 30 Servers ki list
    let servers = await getServers();
    if (!servers || servers.length === 0) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(`No servers available! Please try again later.${FOOTER}`);
    }

    // STEP 2: Sab se khaali server
    let best = await getBestServer(servers);
    if (!best) best = servers
