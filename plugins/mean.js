
const { bot } = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'mean ?(.*)',
        fromMe: true,
        desc: 'Get meaning of a word',
        type: 'AHMII',
    },
    async (message, match) => {
        try {
            const word = match.trim();

            if (!word)
                return await message.send(
                    'It is necessary to send a word!' + FOOTER
                );

            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
            );

            if (!response.ok)
                return await message.send(
                    'Oops!! No results found!' + FOOTER
                );

            const json = await response.json();

            if (!Array.isArray(json) || !json.length)
                return await message.send(
                    'Oops!! No results found!' + FOOTER
                );

            const definition = json[0].meanings?.[0]?.definitions?.[0]?.definition;

            if (!definition)
                return await message.send(
                    'Oops!! No results found!' + FOOTER
                );

            return await message.send(
                `*${json[0].word}*\n\n*Meaning:*\n${definition}${FOOTER}`
            );
        } catch (error) {
            console.error('Mean Error:', error);
            return await message.send(
                'Failed to get word meaning!' + FOOTER
            );
        }
    }
);

bot(
    {
        pattern: 'dict ?(.*)',
        fromMe: true,
        desc: 'Get meaning of a word',
        type: 'AHMII',
    },
    async (message, match) => {
        try {
            const word = match.trim();

            if (!word)
                return await message.send(
                    'It is necessary to send a word!' + FOOTER
                );

            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
            );

            if (!response.ok)
                return await message.send(
                    'Oops!! No results found!' + FOOTER
                );

            const json = await response.json();

            if (!Array.isArray(json) || !json.length)
                return await message.send(
                    'Oops!! No results found!' + FOOTER
                );

            let msg = '';
            msg += `*${json[0].word}*\n`;
            msg += '*Meanings:*\n\n';

            for (let i = 0; i < json[0].meanings.length; i++) {
                msg += '*Part of Speech:* ';
                msg += `${json[0].meanings[i].partOfSpeech}\n`;

                for (let j = 0; j < json[0].meanings[i].definitions.length; j++) {
                    const definition = json[0].meanings[i].definitions[j];

                    msg += '*Definition:* ';
                    msg += `${definition.definition}\n`;

                    if (definition.example)
                        msg += `*Example:* ${definition.example}\n`;

                    if (definition.synonyms?.length)
                        msg += `*Synonyms:* ${definition.synonyms.join(', ')}\n`;

                    if (definition.antonyms?.length)
                        msg += `*Antonyms:* ${definition.antonyms.join(', ')}\n`;
                }

                msg += '=============================\n';
            }

            msg += FOOTER;

            return await message.send(msg);
        } catch (error) {
            console.error('Dictionary Error:', error);
            return await message.send(
                'Failed to get word meaning!' + FOOTER
            );
        }
    }
);
