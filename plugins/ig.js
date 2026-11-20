
const { bot, getJson, getBuffer } = require('../lib')

bot(
    {
        pattern: 'ig ?(.*)',
        fromMe: true,
        desc: 'Insta Profile Search',
        type: 'search',
    },
    async (message, match) => {
        if (!match)
            return await message.send(
                '*Give me a instagram username*\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
            )

        try {
            const { result, status } = await getJson(
                `https://levanter.onrender.com/ig?q=${encodeURIComponent(match.trim())}`
            )

            if (!status || !result)
                return await message.send(
                    '*Not found*\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
                )

            const {
                name,
                username,
                avatar,
                posts,
                following,
                followers,
                description,
            } = result

            const { buffer } = await getBuffer(avatar)

            if (!buffer)
                return await message.send('*Profile image not found*')

            await message.send(
                buffer,
                {
                    caption:
                        '```' +
                        `username : ${username}\nname : ${name}\nbio : ${description}\nposts : ${posts}\nfollowers : ${followers}\nfollowning : ${following}` +
                        '```\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*',
                },
                'image'
            )
        } catch (error) {
            return await message.send(
                `*Instagram profile search failed*\n\n${error.message}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            )
        }
    }
)
