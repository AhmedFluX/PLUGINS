
const { bot, textMaker } = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'birthday ?(.*)',
        fromMe: true,
        desc: 'Happy birthday',
        type: 'AHMII',
    },
    async (message, match) => {
        try {
            if (!match)
                return await message.send(
                    'Give me text' + FOOTER
                );

            const effect_url =
                'https://en.ephoto360.com/write-name-on-red-rose-birthday-cake-images-462.html';

            const { status, url } = await textMaker(
                effect_url,
                match.trim()
            );

            if (url)
                return await message.sendFromUrl(url);

            return await message.send(
                'Failed to create birthday image.' + FOOTER
            );
        } catch (error) {
            console.error('Birthday Error:', error);

            return await message.send(
                'Something went wrong!' + FOOTER
            );
        }
    }
);
