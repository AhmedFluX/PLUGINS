// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Command: mute
//  Category: group
// ═══════════════════════════════════
const { cmd } = require('../command');

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "mute",
  alias: ["close", "lock"],
  react: "🔇",
  desc: "Mute the group (admins only)",
  category: "group",
  use: '.mute',
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
    if (!isBotAdmins) return await reply(`I must be admin to mute the group.${FOOTER}`);
    if (!isAdmins && !isCreator) return await reply(`Only group admins or owner can use this command.${FOOTER}`);

    await conn.groupSettingUpdate(from, 'announcement');
    await reply(`*Group has been muted!*\nOnly admins can send messages now.${FOOTER}`);

  } catch (err) {
    console.error("AHMED-MD Mute Error:", err);
    await reply(`Failed to mute group. Something went wrong.${FOOTER}`);
  }
});
