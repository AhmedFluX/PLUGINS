
const { bot, forwardOrBroadCast } = require('../lib/');

let savedMessage = '';

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'setfa ?(.*)',
        fromMe: true,
        desc: 'Set a message for forwarding',
        type: 'AHMII',
    },
    async (message) => {
        if (!message.reply_message) {
            return await message.send(
                '*Reply to a message to set it for forwarding!*' + FOOTER
            );
        }

        savedMessage = message.reply_message;

        return await message.send(
            '*Message saved for forwarding.*' + FOOTER
        );
    }
);

bot(
    {
        pattern: 'fa ?(.*)',
        fromMe: true,
        desc: 'Forward saved message to a recipient',
        type: 'AHMII',
    },
    async (message, match) => {
        if (!savedMessage) {
            return await message.send(
                '*No message has been set. Use .setfa to set one.*' + FOOTER
            );
        }

        const numbers = match
            .split(',')
            .map((num) => num.trim().replace(/[^0-9]/g, ''))
            .filter((num) => num.length > 0);

        if (numbers.length !== 1) {
            return await message.send(
                '*Usage:* .fa 923001234567\n' +
                'Send only to one consenting recipient at a time.' +
                FOOTER
            );
        }

        const jid = numbers[0] + '@s.whatsapp.net';

        try {
            await forwardOrBroadCast(jid, savedMessage);

            return await message.send(
                '*Message forwarded to:* ' + numbers[0] + FOOTER
            );
        } catch (err) {
            console.error('FA Forward Error:', err);

            return await message.send(
                '*Failed to forward the message.*' + FOOTER
            );
        }
    }
);

bot(
    {
        pattern: 'seefa',
        fromMe: true,
        desc: 'View saved message',
        type: 'AHMII',
    },
    async (message) => {
        if (!savedMessage) {
            return await message.send(
                '*No message has been set yet.*' + FOOTER
            );
        }

        return await message.send(
            `*Current saved message:*\n${savedMessage.text || '[Saved message]'}` +
            FOOTER
        );
    }
);
