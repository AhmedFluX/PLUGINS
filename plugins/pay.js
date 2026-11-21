const { cmd } = require('../command');
const { generateWAMessageFromContent, generateMessageIDV2 } = require('@whiskeysockets/baileys');

cmd({
    pattern: "paymsg",
    alias: ["pay", "payment"],
    desc: "Send a custom payment message to a group",
    category: "owner",
    react: "💸",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, reply, text }) => {
    try {
        const footer = "\n\n© POWERED BY AHMED-MD";

        if (!isCreator) return await reply("*📛 Owner Only Command*" + footer);

        // 1. Safe Text Parsing
        let inputText = typeof text === 'string' ? text : (m.text || "");
        const args = inputText.trim().split(/\s+/);

        if (args.length < 2) {
            return await reply("*🍁 Usage:* `.paymsg <grouplink> <message>`" + footer);
        }

        const groupLink = args[0];
        const noteText = args.slice(1).join(" ") + footer;

        // 2. Fetch Group Info (JID)
        const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        if (!inviteMatch) return await reply("❌ Invalid group link format." + footer);

        const inviteCode = inviteMatch[1];
        let targetJid = null;

        try {
            const groupInfo = await conn.groupGetInviteInfo(inviteCode);
            targetJid = groupInfo.id;
        } catch (e) {
            return await reply("❌ Failed to get group info. (Is the bot inside the group?)" + footer);
        }

        // 3. Build Payment Message
        const randomAmount = Math.floor(Math.random() * 500) + 1;
        const scaledAmount = (randomAmount * 1000).toString();

        const paymentMessage = {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                amount1000: scaledAmount,
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: { text: noteText }
                },
                expiryTimestamp: '0',
                amount: {
                    value: scaledAmount,
                    offset: 1000,
                    currencyCode: 'USD'
                }
            }
        };

        // 4. Send to Group
        const fullMessage = generateWAMessageFromContent(targetJid, paymentMessage, {
            userJid: conn.user.id,
            messageId: generateMessageIDV2(conn.user.id)
        });

        await conn.relayMessage(targetJid, fullMessage.message, {
            messageId: fullMessage.key.id
        });

        // 5. React with ✅
        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

    } catch (error) {
        console.error("paymsg Error:", error);
        await reply(`💢 Error: ${error.message}` + "\n\n© POWERED BY AHMED-MD");
    }
});


cmd({
    pattern: "payall",
    alias: ["paytoall"],
    desc: "Send a custom payment message to all groups",
    category: "owner",
    react: "💸",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, reply, text }) => {
    try {
        const footer = "\n\n© POWERED BY AHMED-MD";

        if (!isCreator) return await reply("*📛 Owner Only Command*" + footer);

        // 1. Safe Text Parsing
        let inputText = typeof text === 'string' ? text : (m.text || "");
        inputText = inputText.replace(/^\.?payall\s*/i, '').trim();

        if (!inputText) {
            return await reply("*🍁 Usage:* `.payall <message>`" + footer);
        }

        const noteText = inputText + footer;

        // 2. Fetch All Groups
        let groups = {};

        try {
            groups = await conn.groupFetchAllParticipating();
        } catch (e) {
            return await reply("❌ Failed to fetch groups." + footer);
        }

        const groupJids = Object.keys(groups || {});
        if (groupJids.length === 0) {
            return await reply("❌ No groups found." + footer);
        }

        // 3. Build Payment Message
        const randomAmount = Math.floor(Math.random() * 500) + 1;
        const scaledAmount = (randomAmount * 1000).toString();

        const paymentMessage = {
            requestPaymentMessage: {
                currencyCodeIso4217: 'USD',
                amount1000: scaledAmount,
                requestFrom: '0@s.whatsapp.net',
                noteMessage: {
                    extendedTextMessage: { text: noteText }
                },
                expiryTimestamp: '0',
                amount: {
                    value: scaledAmount,
                    offset: 1000,
                    currencyCode: 'USD'
                }
            }
        };

        // 4. Send to All Groups
        let sent = 0;
        let failed = 0;

        for (const targetJid of groupJids) {
            try {
                const fullMessage = generateWAMessageFromContent(targetJid, paymentMessage, {
                    userJid: conn.user.id,
                    messageId: generateMessageIDV2(conn.user.id)
                });

                await conn.relayMessage(targetJid, fullMessage.message, {
                    messageId: fullMessage.key.id
                });

                sent++;
            } catch (e) {
                failed++;
                console.error("payall send error:", targetJid, e);
            }
        }

        // 5. React with ✅
        await conn.sendMessage(from, {
            react: {
                text: "✅",
                key: mek.key
            }
        });

        await reply(`✅ Message sent to ${sent}/${groupJids.length} groups.${failed ? `\n❌ Failed: ${failed}` : ''}` + footer);

    } catch (error) {
        console.error("payall Error:", error);
        await reply(`💢 Error: ${error.message}` + "\n\n© POWERED BY AHMED-MD");
    }
});
