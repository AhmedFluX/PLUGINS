
const { bot, setVar, forwardOrBroadCast, parsedJid, isGroup } = require('../lib/');

bot(
    {
        pattern: 'antivv ?(.*)',
        desc: 'Set Anti View Once',
        type: 'whatsapp',
    },
    async (message, match) => {
        const parts = match.trim().split(/\s+/);
        const dest = parts[0] || '';
        const scope = parts[1]?.toLowerCase() || '';
        const jid = parsedJid(dest)[0];
        const isDisable = dest === 'off' || dest === 'false' || dest === 'null';
        const validScopes = ['pm', 'gm', 'no-pm', 'no-gm'];

        if (!dest || (!['p', 'g', 'off', 'false', 'null'].includes(dest) && !jid)) {
            return await message.send(
                `> *Usage Examples:*\n` +
                `- antivv g - Send VV in same chat\n` +
                `- antivv p - Send VV to bot/sudo chat\n` +
                `- antivv g pm - Same chat, PMs only\n` +
                `- antivv g gm - Same chat, groups only\n` +
                `- antivv p no-gm - To sudo, exclude groups\n` +
                `- antivv <jid> - Send VV to specific JID\n` +
                `- antivv off - Disable anti view once\n\n` +
                `*Scopes:* pm, gm, no-pm, no-gm\n\n` +
                `*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            );
        }

        if (scope && !validScopes.includes(scope)) {
            return await message.send(
                `*Invalid scope:* ${scope}\n*Valid scopes:* pm, gm, no-pm, no-gm\n\n` +
                `*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            );
        }

        await setVar({ VV: match.trim() }, message.id);

        if (isDisable) {
            return await message.send(
                '_Anti view once has been disabled._\n\n' +
                '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
            );
        }

        const destText = jid
            ? `_View once messages will be sent to: ${jid}_`
            : dest === 'p'
                ? '_View once messages will be sent to your chat or sudo._'
                : '_View once messages will be sent to the chat itself._';

        const scopeText = scope
            ? '\n📌 _' + ({
                'pm': 'Only for personal chats',
                'gm': 'Only for group chats',
                'no-pm': 'Excluding personal chats',
                'no-gm': 'Excluding group chats',
            }[scope]) + '_'
            : '';

        await message.send(
            destText + scopeText +
            '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
        );
    }
);

bot(
    {
        on: 'text',
        fromMe: false,
        type: 'auto_vv',
    },
    async (message, match, ctx) => {
        if (!ctx.VV || ctx.VV === 'null' || ctx.VV === 'false') return;

        const parts = ctx.VV.trim().split(/\s+/);
        const dest = parts[0];
        const scope = parts[1]?.toLowerCase() || '';

        // Scope filtering
        const isGrp = isGroup(message.jid);
        if (scope === 'pm' && isGrp) return;
        if (scope === 'gm' && !isGrp) return;
        if (scope === 'no-pm' && !isGrp) return;
        if (scope === 'no-gm' && isGrp) return;

        const vvJid =
            dest === 'p'
                ? message.client.user.jid
                : dest === 'g'
                    ? message.jid
                    : parsedJid(dest)[0] || message.client.user.jid;

        if (message.message?.message[message.type]?.viewOnce) {
            message.reply_message = null;
            await forwardOrBroadCast(vvJid, message, {
                viewOnce: false,
                quoted: message.data
            });
        }
    }
);
