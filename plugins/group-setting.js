// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Commands: kick, promote, demote
//  Category: group
// ═══════════════════════════════════
const { cmd } = require("../command");

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

// ─── HELPER: Target User Nikalne Ke Liye ───
function getTarget(m) {
  if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0];
  if (m.quoted) return m.quoted.sender;
  return null;
}

// ==================== KICK ====================
cmd({
  pattern: "kick",
  alias: ["k", "remove"],
  react: "💀",
  desc: "Remove a user from the group",
  category: "group",
  use: '.kick @user / reply',
  filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
  try {
    if (!isGroup) return await reply(`This command only works in groups.${FOOTER}`);
    if (!isBotAdmins) return await reply(`I must be admin to remove someone.${FOOTER}`);
    if (!isCreator && !isAdmins) return await reply(`Only bot owner or group admins can use this command.${FOOTER}`);

    let users = getTarget(m);
    if (!users) return await reply(`Please mention or reply to a user to remove.${FOOTER}`);

    const botJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === botJid) return await reply(`I cannot kick myself!${FOOTER}`);
    if (users === mek.sender) return await reply(`You cannot kick yourself!${FOOTER}`);

    await conn.groupParticipantsUpdate(from, [users], "remove");
    await reply(`*Successfully removed from group.*${FOOTER}`, { mentions: [users] });

  } catch (err) {
    console.error("AHMED-MD Kick Error:", err);
    await reply(`Failed to remove user. Something went wrong.${FOOTER}`);
  }
});

// ==================== PROMOTE ====================
cmd({
  pattern: "promote",
  alias: ["p", "giveadmin"],
  react: "👑",
  desc: "Promote a user to admin",
  category: "group",
  use: '.promote @user / reply',
  filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
  try {
    if (!isGroup) return await reply(`This command only works in groups.${FOOTER}`);
    if (!isBotAdmins) return await reply(`I must be admin to promote someone.${FOOTER}`);
    if (!isAdmins && !isCreator) return await reply(`Only group admins or owner can use this command.${FOOTER}`);

    let users = getTarget(m);
    if (!users) return await reply(`Please mention or reply to a user to promote.${FOOTER}`);

    const botJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === botJid) return await reply(`I am already admin!${FOOTER}`);

    await conn.groupParticipantsUpdate(from, [users], "promote");
    await reply(`*Successfully promoted to admin.*${FOOTER}`, { mentions: [users] });

  } catch (err) {
    console.error("AHMED-MD Promote Error:", err);
    await reply(`Failed to promote. Something went wrong.${FOOTER}`);
  }
});

// ==================== DEMOTE ====================
cmd({
  pattern: "demote",
  alias: ["d", "dismiss", "removeadmin"],
  react: "👤",
  desc: "Demote a group admin",
  category: "group",
  use: '.demote @user / reply',
  filename: __filename
}, async (conn, mek, m, { from, isCreator, isBotAdmins, isAdmins, isGroup, reply }) => {
  try {
    if (!isGroup) return await reply(`This command only works in groups.${FOOTER}`);
    if (!isBotAdmins) return await reply(`I must be admin to demote someone.${FOOTER}`);
    if (!isAdmins && !isCreator) return await reply(`Only group admins or owner can use this command.${FOOTER}`);

    let users = getTarget(m);
    if (!users) return await reply(`Please mention or reply to a user to demote.${FOOTER}`);

    const botJid = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (users === botJid) return await reply(`I cannot demote myself!${FOOTER}`);
    if (users === mek.sender) return await reply(`You cannot demote yourself!${FOOTER}`);

    await conn.groupParticipantsUpdate(from, [users], "demote");
    await reply(`*Admin successfully demoted to a normal member.*${FOOTER}`, { mentions: [users] });

  } catch (err) {
    console.error("AHMED-MD Demote Error:", err);
    await reply(`Failed to demote. Something went wrong.${FOOTER}`);
  }
});
