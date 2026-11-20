
const { bot, getJson } = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'shortner ?(.*)',
        fromMe: true,
        desc: 'Shorten a given URL',
        type: 'AHMII',
    },
    async (message, match) => {
        if (!match) {
            return await message.send(
                '> *Example:*\n' +
                '- .shortner https://mantrikaflow.blogspot.com\n' +
                '- .shortner https://example.com' +
                FOOTER
            );
        }

        const longUrl = match.trim();

        try {
            const parsedUrl = new URL(longUrl);

            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return await message.send(
                    '❌ Please provide a valid HTTP/HTTPS URL.' +
                    FOOTER
                );
            }

            const shortUrl = await getJson(
                `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
            );

            if (!shortUrl || typeof shortUrl !== 'string') {
                throw new Error('Invalid shortening response');
            }

            return await message.send(
                `✅ *Shortened URL:*\n${shortUrl}` + FOOTER
            );
        } catch (error) {
            console.error('Shortner Error:', error);

            return await message.send(
                '❌ Error: Unable to shorten the link. Try again later.' +
                FOOTER
            );
        }
    }
);
