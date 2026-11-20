
const { bot } = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'libro ?(.*)',
        fromMe: true,
        desc: 'Search public-domain books',
        type: 'AHMII',
    },
    async (message, match) => {
        try {
            const query = match.trim();

            if (!query) {
                return await message.send(
                    '*📚 LIBRO SEARCH*\n\n' +
                    'Usage: `.libro <book name>`\n' +
                    'Example: `.libro Sherlock Holmes`' +
                    FOOTER
                );
            }

            const apiUrl =
                `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error('Book search failed');
            }

            const data = await response.json();
            const books = data.docs || [];

            if (!books.length) {
                return await message.send(
                    '❌ No books found.' + FOOTER
                );
            }

            let text = '*📚 BOOK SEARCH RESULTS*\n\n';

            for (let i = 0; i < books.length; i++) {
                const book = books[i];

                text += `*${i + 1}. ${book.title || 'Unknown Title'}*\n`;
                text += `👤 Author: ${book.author_name?.join(', ') || 'Unknown'}\n`;
                text += `📅 Year: ${book.first_publish_year || 'Unknown'}\n`;
                text += `📖 Edition Count: ${book.edition_count || 0}\n`;

                if (book.key) {
                    text += `🔗 https://openlibrary.org${book.key}\n`;
                }

                text += '\n';
            }

            text += FOOTER;

            return await message.send(text);
        } catch (error) {
            console.error('LIBRO ERROR:', error);

            return await message.send(
                '❌ Failed to search books. Try again later.' +
                FOOTER
            );
        }
    }
);

module.exports = {};
