/**
 * makeAdmin.js — Apne account ko Admin banao
 * Run: node makeAdmin.js aryan01engg@gmail.com
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('./models/User');

const email = process.argv[2];

if (!email) {
  console.error('❌ Email dalo: node makeAdmin.js your@email.com');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.log(`✅ Done! ${user.name} (${user.email}) is now an ADMIN 👑`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
