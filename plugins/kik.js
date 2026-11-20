
const { isAdmin, bot, jidToNum } = require('../lib/');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'kik ?(.*)',
        fromMe: true,
        desc: 'Remove members from Group.',
        type: 'AHMII',
        onlyGroup: true,
    },
    async (message, match) => {
        if (!match)
            return await message.send(
                'kik 994\nkik 994 kick' + FOOTER
            );

        const participants = await message.groupMetadata(message.jid);
        const isImAdmin = await isAdmin(
            participants,
            message.client.user.jid
        );

        if (!isImAdmin)
            return await message.send(
                "_I'm not admin._" + FOOTER
            );

        const kik = match.includes('kick');

        if (kik) match = match.replace('kick', '').trim();

        const users = participants
            .filter((user) => user.id.startsWith(match))
            .map(({ id }) => id);

        if (!users.length)
            return await message.send(
                'No matching members found.' + FOOTER
            );

        if (kik) {
            await message.Kick(users);
            return await message.send(
                'Member removal request completed.' + FOOTER
            );
        }

        let msg = '';

        for (const user of users) {
            msg += `○ ${jidToNum(user)}\n`;
        }

        return await message.send(msg + FOOTER);
    }
);
