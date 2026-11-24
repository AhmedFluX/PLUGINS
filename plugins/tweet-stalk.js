const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: 'xstalk',
    alias: ['twitterstalk', 'twtstalk'],
    desc: 'Get details about a Twitter/X user.',
    category: 'search',
    react: '🔍',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
`╭━━〔 🔍 AHMED-MD X-STALK 〕━━╮
┃
┃ ✦ .xstalk Username
┃ ✦ Example: .xstalk elonmusk
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            )
        }

        const username = q.replace('@', '').trim()

        const apiUrl = `https://delirius-apiofc.vercel.app/tools/xstalk?username=${encodeURIComponent(username)}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })

        const user = data?.data || data?.result

        if (!data || !data.status || !user) {
            return reply('❌ User not found. Username sahi likho.')
        }

        const verifiedBadge = user.verified ? '✅ Yes' : '❌ No'

        const caption = `╭━━〔 🔍 AHMED-MD 〕━━╮
┃
┃ 👤 *Name:* ${user.name || 'N/A'}
┃ 🔹 *Username:* @${user.username || username}
┃ ✔️ *Verified:* ${verifiedBadge}
┃ 👥 *Followers:* ${user.followers_count ?? user.followers ?? 'N/A'}
┃ 👤 *Following:* ${user.following_count ?? user.following ?? 'N/A'}
┃ 📝 *Tweets:* ${user.tweets_count ?? user.tweets ?? 'N/A'}
┃ 📅 *Joined:* ${user.created || user.created_at || 'N/A'}
┃ 🔗 *Profile:* ${user.url || `https://x.com/${username}`}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`

        // Avatar na ho to sirf text bhejega, crash nahi hoga
        if (user.avatar || user.profile_image || user.avatar_url) {
            await conn.sendMessage(from, {
                image: { url: user.avatar || user.profile_image || user.avatar_url },
                caption
            }, { quoted: mek })
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek })
        }

    } catch (error) {
        console.log('AHMED-MD XSTALK ERROR:', error.message)
        reply(`❌ *X-Stalk Failed*\n\nUsername sahi hai? Dobara try karo.\n\n*© Powered By AHMED-MD*`)
    }
})
