// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Command: unmute
//  Category: group
// ═══════════════════════════════════
const { cmd } = require('../command');

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "unmute",
  alias: ["unlock", "open"],
  react: "🔊",
  desc: "Unmute the group (admins only)",
  category: "group",
  use: '.unmute',
  filename: __filename
}, async (conn, mek, m, {
  from,
  isCreator,
  isBotAdmins,
  isAdmins,
  isGroup,
  reply
}) => {
  try {
    if (!isGroup) return await reply(`This command only works in groups.${FOOTER}`);
    if (!isBotAdmins) return await reply(`I must be admin to unmute the group.${FOOTER}`);
    if (!isAdmins && !isCreator) return await reply(`Only group admins or owner can use this command.${FOOTER}`);

    await conn.groupSettingUpdate(from, 'not_announcement');
    await reply(`*Group has been unmuted!*\nEveryone can send messages now.${FOOTER}`);

  } catch (err) {
    console.error("AHMED-MD Unmute Error:", err);
    await reply(`Failed to unmute group. Something went wrong.${FOOTER}`);
  }
});
