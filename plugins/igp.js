const { cmd } = require('../command')
const axios = require('axios')

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'igp',
    alias: ['igs', 'iginfo'],
    desc: 'Search Instagram profile information',
    category: 'search',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const username = (q || '').trim().replace(/^@/, '')

        if (!username) {
            return reply(
                `❌ Please provide an Instagram username.\n\nExample: .ig instagram`
            )
        }

        await conn.sendMessage(from, {
            react: { text: '⏳', key: m.key }
        })

        const apiUrl =
            `https://levanter.onrender.com/ig?q=${encodeURIComponent(username)}`

        const { data } = await axios.get(apiUrl, {
            timeout: 30000
        })

        if (!data || data.status === false) {
            return reply('❌ Instagram profile not found.')
        }

        const profile = data.result || data.data || data

        const avatar =
            profile.profile_pic ||
            profile.profilePic ||
            profile.avatar ||
            profile.profile_picture

        const caption = `📸 *INSTAGRAM PROFILE*

👤 *Username:* ${profile.username || username}
📛 *Name:* ${profile.name || 'Not available'}
📝 *Bio:* ${profile.bio || 'Not available'}

📮 *Posts:* ${profile.posts ?? 'N/A'}
👥 *Followers:* ${profile.followers ?? 'N/A'}
➡️ *Following:* ${profile.following ?? profile.followning ?? 'N/A'}

${FOOTER}`

        if (avatar) {
            await conn.sendMessage(from, {
                image: { url: avatar },
                caption
            }, { quoted: mek })
        } else {
            await reply(caption)
        }

        await conn.sendMessage(from, {
            react: { text: '✅', key: m.key }
        })

    } catch (error) {
        console.error('IG ERROR:', error)

        await conn.sendMessage(from, {
            react: { text: '❌', key: m.key }
        })

        return reply('❌ Instagram profile search failed. Try again later.')
    }
})
