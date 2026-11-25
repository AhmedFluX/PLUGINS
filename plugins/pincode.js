const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "pincode",
  alias: ["pin", "zipcode", "postcode", "postal"],
  react: "📍",
  desc: "Pincode lookup - Pakistan & India",
  category: "misc",
  use: ".pincode <code> / .pincode pk 44000 / .pincode in 110001",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let input = m.body.replace(/^\.pincode\s*/i, '').replace(/^\.pin\s*/i, '').replace(/^\.zipcode\s*/i, '').replace(/^\.postcode\s*/i, '').replace(/^\.postal\s*/i, '').trim();

    if (!input) {
      return reply(`❌ *Example:*\n\n🇵🇰 Pakistan: \`.pincode 44000\`\n🇮🇳 India: \`.pincode 110001\`\n\nYa:\n\`.pincode pk 44000\`\n\`.pincode in 110001\`${FOOTER}`);
    }

    // Country detect karo
    let country = null;
    let code = input;

    if (/^pk\s+/i.test(input)) { country = 'pk'; code = input.replace(/^pk\s+/i, '').trim(); }
    else if (/^in\s+/i.test(input)) { country = 'in'; code = input.replace(/^in\s+/i, '').trim(); }
    else if (/^pak(istan)?\s+/i.test(input)) { country = 'pk'; code = input.replace(/^pak(istan)?\s+/i, '').trim(); }
    else if (/^ind(ia)?\s+/i.test(input)) { country = 'in'; code = input.replace(/^ind(ia)?\s+/i, '').trim(); }
    else {
      // Auto detect - 5 digit = Pakistan, 6 digit = India
      if (/^\d{5}$/.test(input)) country = 'pk';
      else if (/^\d{6}$/.test(input)) country = 'in';
      else return reply(`❌ *Invalid Code!*\n\n🇵🇰 Pakistan code 5 digit hota hai - Example: \`.pincode 44000\`\n🇮🇳 India code 6 digit hota hai - Example: \`.pincode 110001\`${FOOTER}`);
    }

    if (!/^\d+$/.test(code)) return reply(`❌ Sirf number likho! Example: \`.pincode 44000\`${FOOTER}`);

    // ─── 🇵🇰 PAKISTAN ───
    if (country === 'pk') {
      await reply(`*📍 Searching Pakistan ${code}...*${FOOTER}`);
      try {
        const res = await axios.get(`https://api.zippopotam.us/pk/${code}`, { timeout: 10000 });
        const d = res.data;
        let places = d.places.map(p => {
          return `*📍 Area:* ${p['place name']}\n*🏙️ District:* ${p.state}\n*🗺️ Province:* ${d['state abbreviation'] || p.state}\n*🌍 Country:* ${d.country} (${d['country abbreviation']})\n*📌 Postal Code:* ${d['post code']}`;
        }).join('\n\n────────────────\n\n');

        return reply(`*🇵🇰 Pakistan - Details for ${code}:*\n\n${places}${FOOTER}`);
      } catch (e) {
        return reply(`❌ Pakistan ka code *${code}* nahi mila.\n\nTry karo: \`.pincode 44000\` (Islamabad)\n\`.pincode 54000\` (Lahore)\n\`.pincode 75500\` (Karachi)${FOOTER}`);
      }
    }

    // ─── 🇮🇳 INDIA ───
    if (country === 'in') {
      await reply(`*📍 Searching India ${code}...*${FOOTER}`);
      const response = await axios.get(`https://api.postalpincode.in/pincode/${code}`, { timeout: 10000 });
      const data = response.data;

      if (!data || !data[0] || data[0].Status === "Error") {
        return reply(`❌ Sorry, no data found for pincode *${code}*.${FOOTER}`);
      }

      const postOffices = data[0].PostOffice;
      if (!postOffices || postOffices.length === 0) {
        return reply(`❌ No data found for *${code}*.${FOOTER}`);
      }

      let locationDetails = postOffices.slice(0, 5).map(post => {
        return `*📍 Area:* ${post.Name}\n*🏙️ District:* ${post.District}\n*🗺️ State:* ${post.State}\n*🌍 Country:* ${post.Country}\n*🏤 Post Office:* ${post.BranchType}`;
      }).join('\n\n────────────────\n\n');

      let total = postOffices.length > 5 ? `\n\n+${postOffices.length - 5} aur areas hain...` : '';
      return reply(`*🇮🇳 India - Details for Pincode ${code}:*\n\n${locationDetails}${total}${FOOTER}`);
    }

  } catch (e) {
    console.log("PINCODE ERROR:", e.message);
    await reply(`🚨 *Failed to retrieve data. Please try again later.*${FOOTER}`);
  }
});
