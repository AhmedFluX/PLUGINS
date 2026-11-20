
const { bot } = require('../lib');

const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'readmore ?(.*)',
        fromMe: true,
        desc: 'Add Readmore text',
        type: 'AHMII',
    },
    async (message, match) => {
        if (!match) {
            return await message.send(
                'Example: .readmore Hi readmore Hello' + FOOTER
            );
        }

        const readmoreText = match.replace(/readmore/gi, readMore);

        try {
            return await message.send(readmoreText + FOOTER);
        } catch (error) {
            console.error('Readmore Error:', error);

            return await message.send(
                '❌ Error.' + FOOTER
            );
        }
    }
);
