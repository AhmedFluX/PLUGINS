// ═══════════════════════════════════
//  AHMED-MD | MADE BY AHMED
//  Command: tagall
//  Category: group
// ═══════════════════════════════════
const { cmd } = require('../command');

// ─── AHMED-MD FOOTER ───
const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
    pattern: "tagall",
    alias: ["gc_tagall", "tag"],
    react: "🔊",
    desc: "To tag all members",
    category: "group",
    use: '.tagall [message]',
    filename: __filename
},
async (conn, mek, m, { from, participants, reply, isGroup, isAdmins, isCreator, args }) => {
    try {
        // ─── GROUP CHECK ───
        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`This command can only be used in groups.${FOOTER}`);
        }

        // ─── PERMISSION CHECK ───
        if (!isAdmins && !isCreator) {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply(`Only group admins or the bot owner can use this command.${FOOTER}`);
        }

        // ─── GROUP INFO ───
        let groupInfo = await conn.groupMetadata(from).catch(() => null);
        if (!groupInfo) return reply(`Failed to fetch group information.${FOOTER}`);

        let groupName = groupInfo.subject || "Unknown Group";
        let totalMembers = participants ? participants.length : 0;
        if (totalMembers === 0) return reply(`No members found in this group.${FOOTER}`);

        let emojis = ['📢', '🔊', '🌐', '🔰', '❤️', '🤍', '🖤', '🩵', '📝', '💗', '🔖', '🪩', '📦', '🎉', '🛡️', '💸', '⏳', '🗿', '🚀', '🎧', '🪀', '⚡', '🚩', '🍁', '🗣️', '👻', '⚠️', '🔥'];

        // ─── MESSAGE ───
        let message = args.join(" ").trim();
        if (!message) message = "Attention Everyone";

        // ─── TEXT - AHMED-MD STYLE ───
        let teks = `*Group:* ${groupName}\n*Members:* ${totalMembers}\n*Message:* ${message}\n\n*MENTIONS*\n`;

        for (let mem of participants) {
            if (!mem.id) continue;
            let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            teks += `${randomEmoji} @${mem.id.split('@')[0]}\n`;
        }

        teks += FOOTER;

        await conn.sendMessage(from, { text: teks, mentions: participants.map(a => a.id) }, { quoted: mek });

    } catch (e) {
        console.error("AHMED-MD TagAll Error:", e);
        await reply(`Error Occurred!\n\n${e.message || e}${FOOTER}`);
    }
});
