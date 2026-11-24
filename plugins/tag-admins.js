// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Command: tagadmins
//  Category: group
// ═══════════════════════════════════
const { cmd } = require('../command');
const { getGroupAdmins } = require('../lib/functions');

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
    pattern: "tagadmins",
    alias: ["admin", "tagadmin", "gc_tagadmins"],
    react: "👑",
    desc: "To tag all admins of the group",
    category: "group",
    use: '.tagadmins [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, args }) => {
    try {
        if (!isGroup) return reply(`This command can only be used in groups.${FOOTER}`);

        // ─── GROUP INFO ───
        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply(`Failed to fetch group information.${FOOTER}`);

        let groupName = groupInfo.subject || "Unknown Group";
        let admins = await getGroupAdmins(participants);
        let totalAdmins = admins ? admins.length : 0;
        if (totalAdmins === 0) return reply(`No admins found in this group.${FOOTER}`);

        // ─── MESSAGE ───
        let message = args.join(" ").trim();
        if (!message) message = "Attention Admins";

        let emojis = ['👑', '⚡', '🌟', '✨', '🎖️', '💎', '🔱', '🛡️', '🚀', '🏆'];

        // ─── TEXT - AHMED-MD STYLE ───
        let teks = `*Group:* ${groupName}\n*Admins:* ${totalAdmins}\n*Message:* ${message}\n\n*ADMIN MENTIONS*\n`;

        for (let admin of admins) {
            if (!admin) continue;
            let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            teks += `${randomEmoji} @${admin.split('@')[0]}\n`;
        }

        teks += FOOTER;

        await conn.sendMessage(from, { text: teks, mentions: admins }, { quoted: mek });

    } catch (e) {
        console.error("AHMED-MD TagAdmins Error:", e);
        await reply(`Error Occurred!\n\n${e.message || e}${FOOTER}`);
    }
});
