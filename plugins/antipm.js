
const {
    bot,
    jidToNum,
    setVar,
    getJid,
    setData,
    getData
} = require('../lib');

const FOOTER = '\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*';

bot(
    {
        pattern: 'antipm ?(.*)',
        desc: 'Block private messages',
        type: 'AHMII',
    },
    async (message, match, ctx) => {
        match = match.trim();

        if (
            !match ||
            (message.isGroup &&
                !match.startsWith('allow') &&
                !match.startsWith('remove') &&
                match !== 'list')
        ) {
            return await message.send(
                'Example:\n' +
                '- antipm on | off\n' +
                '- antipm allow\n' +
                '- antipm allow 12345,67890\n' +
                '- antipm remove 12345,67890\n' +
                '- antipm list' +
                FOOTER
            );
        }

        if (match === 'off' || match === 'on') {
            await setVar(
                { ANTIPM: match === 'on' ? 'true' : 'false' },
                message.id
            );

            return await message.send(
                `AntiPM ${match === 'on' ? 'Enabled' : 'Disabled'}` +
                FOOTER
            );
        }

        if (match === 'list') {
            const currentNums =
                await getData('ANTIPM_NUMS', message.id) || '';

            const list = currentNums
                .split(',')
                .map(n => n.trim())
                .filter(Boolean);

            if (list.length === 0) {
                return await message.send(
                    '_No allowed numbers_' + FOOTER
                );
            }

            return await message.send(
                `*Allowed (${list.length}):*\n` +
                list.map(n => `• ${n}`).join('\n') +
                FOOTER
            );
        }

        if (
            match.startsWith('allow') ||
            match.startsWith('remove')
        ) {
            const action = match.startsWith('allow')
                ? 'allow'
                : 'remove';

            const input = match.replace(action, '').trim();
            const numbers = [];

            if (input) {
                input.split(',').forEach(n => {
                    const clean = n.trim().replace(/[^0-9]/g, '');
                    if (clean) numbers.push(clean);
                });
            } else if (
                message.reply_message &&
                message.reply_message.jid
            ) {
                const rjid = await getJid(
                    message.reply_message.jid,
                    message.id
                );

                numbers.push(jidToNum(rjid));
            } else if (!message.isGroup) {
                const jid = await getJid(message.jid, message.id);
                numbers.push(jidToNum(jid));
            }

            if (numbers.length === 0) {
                return await message.send(
                    '_Invalid numbers provided_' + FOOTER
                );
            }

            const currentNums =
                await getData('ANTIPM_NUMS', message.id) || '';

            const currentSet = new Set(
                currentNums.split(',').map(n => n.trim()).filter(Boolean)
            );

            if (action === 'allow') {
                numbers.forEach(n => currentSet.add(n));

                await setData(
                    'ANTIPM_NUMS',
                    Array.from(currentSet).join(','),
                    message.id
                );

                return await message.send(
                    `Allowed: ${numbers.join(', ')}` + FOOTER
                );
            }

            const removed = numbers.filter(n => currentSet.delete(n));

            await setData(
                'ANTIPM_NUMS',
                Array.from(currentSet).join(','),
                message.id
            );

            return await message.send(
                removed.length
                    ? `Removed: ${removed.join(', ')}` + FOOTER
                    : '_None of those were allowed_' + FOOTER
            );
        }
    }
);

bot(
    {
        on: 'text',
        fromMe: true,
        type: 'AHMII',
    },
    async (message, match, ctx) => {
        if (
            !message.isGroup &&
            !message.jid.includes('broadcast')
        ) {
            if (ctx.ANTIPM ? ctx.ANTIPM === 'true' : true) {
                const jid = await getJid(message.jid, message.id);
                const num = jidToNum(jid);

                const currentNums =
                    await getData('ANTIPM_NUMS', message.id) || '';

                const allowedList = currentNums.split(',');

                if (!allowedList.includes(num)) {
                    const currentSet = new Set(
                        allowedList.map(n => n.trim()).filter(Boolean)
                    );

                    currentSet.add(num);

                    await setData(
                        'ANTIPM_NUMS',
                        Array.from(currentSet).join(','),
                        message.id
                    );
                }
            }
        }
    }
);

bot(
    {
        on: 'text',
        fromMe: false,
        type: 'AHMII',
    },
    async (message, match, ctx) => {
        if (
            !message.isGroup &&
            !message.fromMe &&
            (ctx.ANTIPM ? ctx.ANTIPM === 'true' : true) &&
            !message.sudo
        ) {
            const jid = await getJid(
                message.participant || message.jid,
                message.id
            );

            const num = jidToNum(jid);

            const currentNums =
                await getData('ANTIPM_NUMS', message.id) || '';

            const allowedList = currentNums
                .split(',')
                .map(n => n.trim())
                .filter(Boolean);

            if (!allowedList.includes(num)) {
                await message.send('_Personal Message Not Allowed_');
                await message.Block(jid);
            }
        }
    }
);
