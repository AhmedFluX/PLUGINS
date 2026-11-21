// Existing .paymsg command — same as your original code
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

        let inputText = typeof text === "string" ? text : (m.text || "");
        const args = inputText.trim().split(/\s+/);

        if (args.length < 2) {
            return await reply("*🍁 Usage:* `.paymsg <grouplink> <message>`" + footer);
        }

        const groupLink = args[0];
        const noteText = args.slice(1).join(" ") + footer;

        const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
        if (!inviteMatch) return await reply("❌ Invalid group link format." + footer);

        let targetJid;

        try {
            const groupInfo = await conn.groupGetInviteInfo(inviteMatch[1]);
            targetJid = groupInfo.id;
        } catch (e) {
            return await reply("❌ Failed to get group info. (Is the bot inside the group?)" + footer);
        }

        const randomAmount = Math.floor(Math.random() * 500) + 1;
        const scaledAmount = (randomAmount * 1000).toString();

        const paymentMessage = {
            requestPaymentMessage: {
                currencyCodeIso4217: "USD",
                amount1000: scaledAmount,
                requestFrom: "0@s.whatsapp.net",
                noteMessage: {
                    extendedTextMessage: { text: noteText }
                },
                expiryTimestamp: "0",
                amount: {
                    value: scaledAmount,
                    offset: 1000,
                    currencyCode: "USD"
                }
            }
        };

        const fullMessage = generateWAMessageFromContent(targetJid, paymentMessage, {
            userJid: conn.user.id,
            messageId: generateMessageIDV2(conn.user.id)
        });

        await conn.relayMessage(targetJid, fullMessage.message, {
            messageId: fullMessage.key.id
        });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });
    } catch (error) {
        console.error("paymsg Error:", error);
        await reply(`💢 Error: ${error.message}\n\n© POWERED BY AHMED-MD`);
    }
});


// New .payall command — in the same plugin/file
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

        const noteText = (typeof text === "string" ? text : "").trim();

        if (!noteText) {
            return await reply("*🍁 Usage:* `.payall <message>`" + footer);
        }

        const groups = await conn.groupFetchAllParticipating();
        const groupJids = Object.keys(groups || {});

        if (!groupJids.length) {
            return await reply("❌ No groups found." + footer);
        }

        const randomAmount = Math.floor(Math.random() * 500) + 1;
        const scaledAmount = (randomAmount * 1000).toString();

        const paymentMessage = {
            requestPaymentMessage: {
                currencyCodeIso4217: "USD",
                amount1000: scaledAmount,
                requestFrom: "0@s.whatsapp.net",
                noteMessage: {
                    extendedTextMessage: { text: noteText + footer }
                },
                expiryTimestamp: "0",
                amount: {
                    value: scaledAmount,
                    offset: 1000,
                    currencyCode: "USD"
                }
            }
        };

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
            } catch (err) {
                failed++;
                console.error(`payall failed for ${targetJid}:`, err);
            }
        }

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

        return await reply(
            `✅ Sent to ${sent}/${groupJids.length} groups.` +
            (failed ? `\n❌ Failed: ${failed}` : "") +
            footer
        );
    } catch (error) {
        console.error("payall Error:", error);
        await reply(`💢 Error: ${error.message}\n\n© POWERED BY AHMED-MD`);
    }
});
