const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const axios = require('axios');
const { lidToPhone } = require('../lib/functions');

async function getTargetJid(conn, target) {
    if (!target) return null;
    if (target.includes('@s.whatsapp.net')) return target;
    if (target.includes('@lid')) {
        try {
            const phone = await lidToPhone(conn, target);
            if (!phone) return null;
            return phone + '@s.whatsapp.net';
        } catch { return null; }
    }
    return target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}

function isValidNumber(target) {
    if (!target) return false;
    const num = target.replace('@s.whatsapp.net','').replace(/[^0-9]/g,'');
    return num.length >= 10;
}

const onlyOwner = (reply) => reply("*This is an owner command.*\n\n> *AHMED-MD*");

async function toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key, label, usage }) {
    if (!args[0]) return reply(`*Usage:* ${usage}\n*Current:* ${userConfig[key] || 'false'}`);
    const value = args[0].toLowerCase();
    if (value !== 'on' && value !== 'off') return reply('*Please use:* on or off');
    const newValue = value === 'on' ? 'true' : 'false';
    userConfig[key] = newValue;
    await updateUserConfig(sanitizedNumber, userConfig);
    return reply(`*${label} set to:* ${newValue}\n\n> *AHMED-MD*`);
}

async function getTarget(conn, m, args) {
    let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);
    if (!target && args[0]) {
        const cleaned = args[0].replace(/[^0-9]/g,'');
        if (cleaned && cleaned.length >= 10) target = cleaned + "@s.whatsapp.net";
    }
    if (!target || !isValidNumber(target)) return null;
    target = await getTargetJid(conn, target);
    return target;
}

// WELCOME / GOODBYE
cmd({ pattern: "welcome", desc: "Toggle welcome", category: "settings", react: "🎉", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'WELCOME', label: 'Welcome', usage: 'welcome on/off' });
});

cmd({ pattern: "goodbye", desc: "Toggle goodbye", category: "settings", react: "👋", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'GOODBYE', label: 'Goodbye', usage: 'goodbye on/off' });
});

cmd({ pattern: "setwelcome", desc: "Set welcome msg", category: "settings", react: "✏️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Current:*\n${userConfig.WELCOME_MESSAGE || 'Not set'}\n\n*Usage:* .setwelcome <message>\n• @user • @group • @desc • @count • @bot • @time`);
    userConfig.WELCOME_MESSAGE = args.join(' ');
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Welcome message set:*\n\n${userConfig.WELCOME_MESSAGE}\n\n> *AHMED-MD*`);
});

cmd({ pattern: "setgoodbye", desc: "Set goodbye msg", category: "settings", react: "✏️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Current:*\n${userConfig.GOODBYE_MESSAGE || 'Not set'}\n\n*Usage:* .setgoodbye <message>`);
    userConfig.GOODBYE_MESSAGE = args.join(' ');
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Goodbye message set:*\n\n${userConfig.GOODBYE_MESSAGE}\n\n> *AHMED-MD*`);
});

// BAN / UNBAN / BANLIST
cmd({ pattern: "ban", desc: "Ban user", category: "moderation", react: "🔨", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber, botNumber2 }) => {
    if (!isCreator) return onlyOwner(reply);
    const target = await getTarget(conn, m, args);
    if (!target) return reply("*Usage:* .ban @user / .ban 92300xxxxxxx / reply");
    if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) return reply("I can't ban myself!");
    if (target.includes(extractNumber(config.OWNER_NUMBER))) return reply("Cannot ban the owner!");
    let list = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];
    if (list.includes(target)) return reply("This user is already banned!");
    list.push(target); userConfig.BANNED = list;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*User banned successfully!*\nUser: ${extractNumber(target)}\n\n> *AHMED-MD*`);
});

cmd({ pattern: "unban", desc: "Unban user", category: "moderation", react: "🔓", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    const target = await getTarget(conn, m, args);
    if (!target) return reply("*Usage:* .unban @user / number / reply");
    let list = Array.isArray(userConfig.BANNED) ? [...userConfig.BANNED] : [];
    if (!list.includes(target)) return reply("This user is not banned!");
    userConfig.BANNED = list.filter(j => j !== target);
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*User unbanned successfully!*\nUser: ${extractNumber(target)}`);
});

cmd({ pattern: "banlist", alias: ["banned"], desc: "Banned list", category: "moderation", react: "📋", filename: __filename },
async (conn, mek, m, { reply, isCreator, userConfig }) => {
    if (!isCreator) return onlyOwner(reply);
    const list = Array.isArray(userConfig.BANNED) ? userConfig.BANNED : [];
    if (!list.length) return reply("*No banned users found.*");
    let t = "*Banned Users List:*\n\n";
    list.forEach((u,i)=> t += `${i+1}. ${extractNumber(u)}\n`);
    await reply(t);
});

// SUDO
cmd({ pattern: "sudo", desc: "Add sudo", category: "moderation", react: "👑", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber, botNumber2 }) => {
    if (!isCreator) return onlyOwner(reply);
    const target = await getTarget(conn, m, args);
    if (!target) return reply("*Usage:* .sudo @user / number / reply");
    if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) return reply("Can't sudo myself!");
    let list = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];
    if (list.includes(target)) return reply("This user is already in sudo list!");
    list.push(target); userConfig.SUDO = list;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*User added to sudo list!*\nUser: ${extractNumber(target)}`);
});

cmd({ pattern: "delsudo", alias: ["removesudo"], desc: "Remove sudo", category: "moderation", react: "👑", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    const target = await getTarget(conn, m, args);
    if (!target) return reply("*Usage:* .delsudo @user / number / reply");
    let list = Array.isArray(userConfig.SUDO) ? [...userConfig.SUDO] : [];
    if (!list.includes(target)) return reply("This user is not in sudo list!");
    userConfig.SUDO = list.filter(j=>j!==target);
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*User removed from sudo list!*`);
});

cmd({ pattern: "listsudo", alias: ["sudoers"], desc: "Sudo list", category: "moderation", react: "📋", filename: __filename },
async (conn, mek, m, { reply, isCreator, userConfig }) => {
    if (!isCreator) return onlyOwner(reply);
    const list = Array.isArray(userConfig.SUDO) ? userConfig.SUDO : [];
    if (!list.length) return reply("*No sudo users found.*");
    let t = "*Sudo Users List:*\n\n";
    list.forEach((u,i)=> t += `${i+1}. ${extractNumber(u)}\n`);
    await reply(t);
});

// ANTI FEATURES
cmd({ pattern: "antiedit", desc: "Anti edit", category: "settings", react: "✏️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* antiedit on/off\n*Current:* ${userConfig.ANTI_EDIT || 'false'}\n*Path:* ${userConfig.ANTIEDIT_PATH || 'inbox'}`);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'ANTI_EDIT', label: 'Anti-Edit', usage: 'antiedit on/off' });
});

cmd({ pattern: "editpath", desc: "Edit path", category: "settings", react: "📍", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* editpath inbox/same\n*Current:* ${userConfig.ANTIEDIT_PATH || 'inbox'}`);
    const v = args[0].toLowerCase();
    if (v!=='inbox' && v!=='same') return reply('Please use: inbox or same');
    userConfig.ANTIEDIT_PATH = v;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Edit path set to:* ${v}`);
});

cmd({ pattern: "autoread", alias: ["readmsg"], desc: "Auto read", category: "settings", react: "👁️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'READ_MESSAGE', label: 'Auto-Read', usage: 'autoread on/off' });
});

cmd({ pattern: "antilink", alias: ["linkblock"], desc: "Anti link", category: "settings", react: "🚫", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* antilink on/off/warn/delete\n*Current:* ${userConfig.ANTI_LINK || 'off'}`);
    const v = args[0].toLowerCase();
    if (!['on','off','warn','delete'].includes(v)) return reply("Please use: on, off, warn, delete");
    const map = { on:'true', off:'false', warn:'warn', delete:'delete' };
    userConfig.ANTI_LINK = map[v];
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Anti-link set to:* ${v}\n\n> *AHMED-MD*`);
});

cmd({ pattern: "antidelete", alias: ["antidel"], desc: "Anti delete", category: "settings", react: "🗑️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'ANTI_DELETE', label: 'Anti Delete', usage: 'antidelete on/off' });
});

cmd({ pattern: "recording", alias: ["autorecording"], desc: "Auto recording", category: "settings", react: "🎙️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'AUTO_RECORDING', label: 'Auto Recording', usage: 'recording on/off' });
});

cmd({ pattern: "statusview", alias: ["autoview"], desc: "Auto view status", category: "settings", react: "👁️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'AUTO_STATUS_SEEN', label: 'Auto View Status', usage: 'statusview on/off' });
});

cmd({ pattern: "autoreact", alias: ["autoreaction"], desc: "Auto react", category: "settings", react: "🤖", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'AUTO_REACT', label: 'Auto React', usage: 'autoreact on/off' });
});

cmd({ pattern: "anticall", alias: ["antcall"], desc: "Anti call", category: "settings", react: "📵", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'ANTI_CALL', label: 'Anti-Call', usage: 'anticall on/off' });
});

cmd({ pattern: "anticallmsg", alias: ["callmsg"], desc: "Anti call msg", category: "settings", react: "📝", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Current:*\n${userConfig.REJECT_MSG || config.REJECT_MSG || "*Call not allowed - AHMED-MD*"}\n\n*Usage:* anticallmsg <message>`);
    userConfig.REJECT_MSG = args.join(' ');
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Anti-Call reject message set to:*\n${userConfig.REJECT_MSG}`);
});

cmd({ pattern: "adminaction", desc: "Admin notify", category: "settings", react: "👑", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'ADMIN_ACTION', label: 'Admin Action', usage: 'adminaction on/off' });
});

cmd({ pattern: "autotyping", alias: ["typing"], desc: "Auto typing", category: "settings", react: "⌨️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'AUTO_TYPING', label: 'Auto Typing', usage: 'autotyping on/off' });
});

cmd({ pattern: "online", alias: ["alwaysonline"], desc: "Always online", category: "settings", react: "💚", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    await toggleSetting({ reply, args, userConfig, updateUserConfig, sanitizedNumber, key: 'ALWAYS_ONLINE', label: 'Always Online', usage: 'online on/off' });
});

// MODE / PREFIX / NAMES
cmd({ pattern: "mode", alias: ["mod"], desc: "Bot mode", category: "settings", react: "🌐", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* mode public/private/inbox\n*Current:* ${userConfig.MODE || 'public'}`);
    const mode = args[0].toLowerCase();
    if (!['public','private','inbox'].includes(mode)) return reply('Available modes: public, private, inbox');
    userConfig.MODE = mode;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Bot mode set to:* ${mode}`);
});

cmd({ pattern: "prefix", desc: "Change prefix", category: "settings", react: "🪟", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* prefix <new_prefix>\n*Current:* ${userConfig.PREFIX || '.'}`);
    const p = args[0];
    if (p.length > 2) return reply('Prefix must be 1-2 characters max');
    userConfig.PREFIX = p;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Prefix changed to:* ${p}\n*Example:* ${p}menu`);
});

cmd({ pattern: "botname", alias: ["name"], desc: "Bot name", category: "settings", react: "🤖", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* botname <name>\n*Current:* ${userConfig.BOT_NAME || config.BOT_NAME || 'AHMED-MD'}`);
    const n = args.join(' ');
    if (n.length > 30) return reply('Bot name must be under 30 characters');
    userConfig.BOT_NAME = n;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Bot name set to:* ${n}`);
});

cmd({ pattern: "ownername", alias: ["owner"], desc: "Owner name", category: "settings", react: "👑", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* ownername <name>\n*Current:* ${userConfig.OWNER_NAME || config.OWNER_NAME}`);
    userConfig.OWNER_NAME = args.join(' ');
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Owner name set to:* ${userConfig.OWNER_NAME}`);
});

cmd({ pattern: "ownernumber", alias: ["ownernum"], desc: "Owner number", category: "settings", react: "📞", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* ownernumber <number>\n*Current:* ${userConfig.OWNER_NUMBER || config.OWNER_NUMBER}`);
    if (!args[0].match(/^\d{10,15}$/)) return reply('Please enter a valid phone number (10-15 digits)');
    userConfig.OWNER_NUMBER = args[0];
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Owner number set to:* ${args[0]}`);
});

cmd({ pattern: "description", alias: ["desc"], desc: "Bot description", category: "settings", react: "📝", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* description <text>\n*Current:* ${userConfig.DESCRIPTION || config.DESCRIPTION}`);
    const d = args.join(' ');
    if (d.length > 200) return reply('Description must be under 200 characters');
    userConfig.DESCRIPTION = d;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Bot description set!*`);
});

// BOT DP - FIXED
cmd({ pattern: "botdp", alias: ["botimage","botpic"], desc: "Set bot DP", category: "settings", react: "🖼️", filename: __filename },
async (conn, mek, m, { from, reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    let imageUrl = args[0];
    try {
        if (!imageUrl && m.quoted) {
            const quoted = m.quoted;
            const mime = quoted.mimetype || quoted.msg?.mimetype || '';
            if (!mime.startsWith('image')) return reply("Please reply to an image!");
            const mediaBuffer = await conn.downloadMediaMessage(quoted);
            if (!mediaBuffer) return reply("Download failed, try again!");
            const ext = mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : '.png';
            const tmp = path.join(os.tmpdir(), `ahmedmd_${Date.now()}${ext}`);
            fs.writeFileSync(tmp, mediaBuffer);
            const form = new FormData();
            form.append("fileToUpload", fs.createReadStream(tmp), `ahmedmd${ext}`);
            form.append("reqtype", "fileupload");
            const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders(), timeout: 30000 });
            try { fs.unlinkSync(tmp); } catch {}
            if (typeof res.data !== 'string' || !res.data.startsWith('https://')) return reply(`Upload failed: ${res.data}`);
            imageUrl = res.data;
        }
        if (!imageUrl || !imageUrl.startsWith("http")) return reply("Provide a valid image URL or reply to an image!\n*Usage:* .botdp <url>");
        userConfig.BOT_IMAGE = imageUrl;
        await updateUserConfig(sanitizedNumber, userConfig);
        await conn.sendMessage(from, { image: { url: imageUrl }, caption: `*AHMED-MD DP Updated!*\n\nImage URL: ${imageUrl}` }, { quoted: mek });
    } catch (e) {
        console.error("BOTDP ERROR:", e);
        return reply(`Error: ${e.message}`);
    }
});

cmd({ pattern: "stickername", alias: ["stname"], desc: "Sticker pack name", category: "settings", react: "🖼️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* .stickername <name>\n*Current:* ${userConfig.STICKER_NAME || 'AHMED-MD'}`);
    userConfig.STICKER_NAME = args.join(' ');
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Sticker pack name set to:* ${userConfig.STICKER_NAME}`);
});

cmd({ pattern: "delpath", alias: ["deletepath"], desc: "Anti-delete path", category: "settings", react: "🗑️", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* .delpath same/inbox\n*Current:* ${userConfig.ANTI_DELETE_PATH || 'inbox'}`);
    const v = args[0].toLowerCase();
    if (v!=='same' && v!=='inbox') return reply('Please use: same or inbox');
    userConfig.ANTI_DELETE_PATH = v;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Anti-delete path set to:* ${v}`);
});

cmd({ pattern: "reactemojis", alias: ["reacts"], desc: "Set react emojis", category: "settings", react: "😂", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* .reactemojis 😂,❤️,🔥\n*Current:* ${(userConfig.REACT_EMOJIS || []).join(', ')}`);
    const emojis = args.join(' ').split(',').map(e=>e.trim()).filter(Boolean);
    if (!emojis.length) return reply('Please provide valid emojis. Example: 😂,❤️,🔥');
    userConfig.REACT_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Auto react emojis set:*\n${emojis.join(', ')}`);
});

cmd({ pattern: "owneremojis", alias: ["ownerreacts"], desc: "Owner emojis", category: "settings", react: "👑", filename: __filename },
async (conn, mek, m, { reply, isCreator, args, updateUserConfig, userConfig, sanitizedNumber }) => {
    if (!isCreator) return onlyOwner(reply);
    if (!args[0]) return reply(`*Usage:* .owneremojis 👑,⭐,💎\n*Current:* ${(userConfig.OWNER_EMOJIS || []).join(', ')}`);
    const emojis = args.join(' ').split(',').map(e=>e.trim()).filter(Boolean);
    if (!emojis.length) return reply('Please provide valid emojis!');
    userConfig.OWNER_EMOJIS = emojis;
    await updateUserConfig(sanitizedNumber, userConfig);
    await reply(`*Owner emojis set:*\n${emojis.join(', ')}`);
});

// SETTINGS MENU - AHMED-MD
cmd({ pattern: "settings", alias: ["setting","env","config"], desc: "Settings menu", category: "settings", react: "⚙️", filename: __filename },
async (conn, mek, m, { reply, isCreator, prefix, userConfig }) => {
    if (!isCreator) return onlyOwner(reply);
    const botName = userConfig.BOT_NAME || config.BOT_NAME || "AHMED-MD";
    const p = userConfig.PREFIX || prefix || '.';
    const txt = `*${botName} Settings Menu* ⚙️

*General Settings*
${p}welcome on/off
${p}goodbye on/off
${p}setwelcome <message>
${p}setgoodbye <message>

*Anti Features*
${p}antiedit on/off
${p}editpath inbox/same
${p}antilink on/off/warn/delete
${p}antidelete on/off
${p}anticall on/off
${p}anticallmsg <message>

*Auto Features*
${p}autoread on/off
${p}recording on/off
${p}statusview on/off
${p}autoreact on/off
${p}autotyping on/off
${p}online on/off

*Moderation*
${p}ban @user
${p}unban @user
${p}banlist
${p}sudo @user
${p}delsudo @user
${p}listsudo

*Bot Settings*
${p}mode public/private/inbox
${p}prefix <new_prefix>
${p}botname <name>
${p}ownername <name>
${p}ownernumber <number>
${p}description <text>
${p}botdp <url>
${p}stickername <name>
${p}delpath same/inbox
${p}reactemojis 😂,❤️,🔥
${p}owneremojis 👑,⭐,💎

*Current Status*
Welcome: ${userConfig.WELCOME || 'false'}
Goodbye: ${userConfig.GOODBYE || 'false'}
Anti-Edit: ${userConfig.ANTI_EDIT || 'false'}
Anti-Link: ${userConfig.ANTI_LINK || 'off'}
Anti-Delete: ${userConfig.ANTI_DELETE || 'false'}
Anti-Call: ${userConfig.ANTI_CALL || 'false'}
Auto-Read: ${userConfig.READ_MESSAGE || 'false'}
Auto-React: ${userConfig.AUTO_REACT || 'false'}
Mode: ${userConfig.MODE || 'public'}
Prefix: ${p}

> *POWERED BY AHMED-MD*`;
    await reply(txt);
});
