/**
 * seedUsers.js — 15 realistic test users seed karo
 * Run: node seedUsers.js
 */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

// ── 15 Realistic test users ─────────────────────────────────────────────────
const testUsers = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@test.com',
    age: 26,
    gender: 'Male',
    city: 'Mumbai',
    nationality: 'Indian',
    travelStyle: 'Adventure',
    budget: '₹3000/day',
    bio: 'Adventure seeker from Mumbai. Love trekking, scuba diving and street food. Looking for a travel partner for Southeast Asia trip!',
    interests: ['Trekking', 'Photography', 'Street Food'],
    languages: ['Hindi', 'English'],
    photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
    verified: true,
    rating: 4.5,
    reviewCount: 8,
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@test.com',
    age: 24,
    gender: 'Female',
    city: 'Bangalore',
    nationality: 'Indian',
    travelStyle: 'Cultural',
    budget: '₹2000/day',
    bio: 'Travel blogger and cultural explorer. Visited 12 countries so far. Always looking for authentic local experiences.',
    interests: ['Culture', 'Food', 'Yoga', 'Art'],
    languages: ['Malayalam', 'English', 'Hindi'],
    photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
    verified: true,
    rating: 4.8,
    reviewCount: 15,
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan.mehta@test.com',
    age: 28,
    gender: 'Male',
    city: 'Delhi',
    nationality: 'Indian',
    travelStyle: 'Backpacker',
    budget: '₹1000/day',
    bio: 'Minimalist backpacker. 40L bag, endless curiosity. Have traveled across India on a budget. Next stop: Central Asia.',
    interests: ['Hiking', 'History', 'Local Transport'],
    languages: ['Hindi', 'English', 'Punjabi'],
    photos: ['https://randomuser.me/api/portraits/men/67.jpg'],
    verified: false,
    rating: 4.2,
    reviewCount: 5,
  },
  {
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@test.com',
    age: 27,
    gender: 'Female',
    city: 'Goa',
    nationality: 'Spanish',
    travelStyle: 'Luxury',
    budget: '€150/day',
    bio: 'Digital nomad originally from Madrid. Currently based in Goa. Love beach, sunset, and good wine. Open to travel partners across Asia.',
    interests: ['Beach', 'Surfing', 'Photography', 'Nightlife'],
    languages: ['Spanish', 'English', 'Portuguese'],
    photos: ['https://randomuser.me/api/portraits/women/26.jpg'],
    verified: true,
    rating: 4.6,
    reviewCount: 11,
  },
  {
    name: 'Karan Patel',
    email: 'karan.patel@test.com',
    age: 30,
    gender: 'Male',
    city: 'Ahmedabad',
    nationality: 'Indian',
    travelStyle: 'Mid-Range',
    budget: '₹4000/day',
    bio: 'Software engineer who travels every quarter. Love unexplored destinations and weekend road trips. Big foodie.',
    interests: ['Road Trips', 'Food', 'Technology', 'Cricket'],
    languages: ['Gujarati', 'Hindi', 'English'],
    photos: ['https://randomuser.me/api/portraits/men/43.jpg'],
    verified: true,
    rating: 4.0,
    reviewCount: 3,
  },
  {
    name: 'Amelia Chen',
    email: 'amelia.chen@test.com',
    age: 25,
    gender: 'Female',
    city: 'Pune',
    nationality: 'Chinese',
    travelStyle: 'Adventure',
    budget: '$80/day',
    bio: 'Exchange student turned permanent India lover. Passionate about Himalayan treks and Indian cuisine. Let\'s explore together!',
    interests: ['Trekking', 'Yoga', 'Street Art', 'Music'],
    languages: ['Mandarin', 'English', 'Hindi'],
    photos: ['https://randomuser.me/api/portraits/women/55.jpg'],
    verified: false,
    rating: 4.4,
    reviewCount: 6,
  },
  {
    name: 'Vikram Reddy',
    email: 'vikram.reddy@test.com',
    age: 32,
    gender: 'Male',
    city: 'Hyderabad',
    nationality: 'Indian',
    travelStyle: 'Cultural',
    budget: '₹5000/day',
    bio: 'History professor with a passion for ancient temples and heritage sites. Have documented 200+ temples across South India.',
    interests: ['History', 'Architecture', 'Photography', 'Reading'],
    languages: ['Telugu', 'Hindi', 'English', 'Sanskrit'],
    photos: ['https://randomuser.me/api/portraits/men/19.jpg'],
    verified: true,
    rating: 4.9,
    reviewCount: 22,
  },
  {
    name: 'Nadia Petrov',
    email: 'nadia.petrov@test.com',
    age: 29,
    gender: 'Female',
    city: 'Jaipur',
    nationality: 'Russian',
    travelStyle: 'Backpacker',
    budget: '$40/day',
    bio: 'Yoga teacher from St. Petersburg, living in Jaipur ashram. Spiritual seeker exploring the colors of Rajasthan.',
    interests: ['Yoga', 'Meditation', 'Handicrafts', 'Desert'],
    languages: ['Russian', 'English', 'Hindi'],
    photos: ['https://randomuser.me/api/portraits/women/33.jpg'],
    verified: true,
    rating: 4.7,
    reviewCount: 9,
  },
  {
    name: 'Arjun Singh',
    email: 'arjun.singh@test.com',
    age: 23,
    gender: 'Male',
    city: 'Chandigarh',
    nationality: 'Indian',
    travelStyle: 'Adventure',
    budget: '₹2500/day',
    bio: 'Just graduated! Taking a gap year to travel across Asia. Love motorcycles, mountains and meeting new people.',
    interests: ['Motorcycling', 'Mountains', 'Music', 'Photography'],
    languages: ['Punjabi', 'Hindi', 'English'],
    photos: ['https://randomuser.me/api/portraits/men/78.jpg'],
    verified: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    name: 'Isabella Rossi',
    email: 'isabella.rossi@test.com',
    age: 31,
    gender: 'Female',
    city: 'Mumbai',
    nationality: 'Italian',
    travelStyle: 'Luxury',
    budget: '€200/day',
    bio: 'Fashion designer from Milan currently working in Mumbai. Lover of art, fine dining and boutique hotels. Exploring India with style!',
    interests: ['Fashion', 'Art', 'Fine Dining', 'Architecture'],
    languages: ['Italian', 'English', 'French'],
    photos: ['https://randomuser.me/api/portraits/women/62.jpg'],
    verified: true,
    rating: 4.3,
    reviewCount: 7,
  },
  {
    name: 'Dev Kumar',
    email: 'dev.kumar@test.com',
    age: 27,
    gender: 'Male',
    city: 'Kolkata',
    nationality: 'Indian',
    travelStyle: 'Cultural',
    budget: '₹1500/day',
    bio: 'Photographer and filmmaker documenting the lives of rural communities. Currently working on a project about river civilizations.',
    interests: ['Photography', 'Film', 'Culture', 'Rivers'],
    languages: ['Bengali', 'Hindi', 'English'],
    photos: ['https://randomuser.me/api/portraits/men/51.jpg'],
    verified: true,
    rating: 4.6,
    reviewCount: 13,
  },
  {
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@test.com',
    age: 26,
    gender: 'Female',
    city: 'Varanasi',
    nationality: 'Japanese',
    travelStyle: 'Cultural',
    budget: '$60/day',
    bio: 'Japanese traveler on a spiritual journey through India. Love the Ganges, ghats, and the sound of evening prayers.',
    interests: ['Spirituality', 'Meditation', 'Ancient Culture', 'Boats'],
    languages: ['Japanese', 'English'],
    photos: ['https://randomuser.me/api/portraits/women/79.jpg'],
    verified: false,
    rating: 4.1,
    reviewCount: 4,
  },
  {
    name: 'Rahul Verma',
    email: 'rahul.verma@test.com',
    age: 35,
    gender: 'Male',
    city: 'Chennai',
    nationality: 'Indian',
    travelStyle: 'Mid-Range',
    budget: '₹3500/day',
    bio: 'Marine biologist who dives for work and for fun. Have explored the Andaman reefs, Lakshadweep, and Red Sea. Looking for dive buddies!',
    interests: ['Scuba Diving', 'Marine Life', 'Snorkeling', 'Conservation'],
    languages: ['Tamil', 'English', 'Hindi'],
    photos: ['https://randomuser.me/api/portraits/men/88.jpg'],
    verified: true,
    rating: 4.7,
    reviewCount: 18,
  },
  {
    name: 'Fatima Al-Hassan',
    email: 'fatima.alhassan@test.com',
    age: 28,
    gender: 'Female',
    city: 'Delhi',
    nationality: 'Emirati',
    travelStyle: 'Luxury',
    budget: '$300/day',
    bio: 'Entrepreneur from Dubai exploring South Asia. Passionate about sustainable luxury travel and meaningful connections.',
    interests: ['Luxury Travel', 'Business', 'Cuisine', 'Wellness'],
    languages: ['Arabic', 'English', 'French'],
    photos: ['https://randomuser.me/api/portraits/women/89.jpg'],
    verified: true,
    rating: 4.5,
    reviewCount: 10,
  },
  {
    name: 'Siddharth Joshi',
    email: 'siddharth.joshi@test.com',
    age: 22,
    gender: 'Male',
    city: 'Indore',
    nationality: 'Indian',
    travelStyle: 'Backpacker',
    budget: '₹800/day',
    bio: 'College student and budget traveler. Explored 15 Indian states in the last 2 years on a shoestring. Hitchhiking enthusiast!',
    interests: ['Hitchhiking', 'Local Food', 'Football', 'Vlogging'],
    languages: ['Hindi', 'English', 'Marathi'],
    photos: ['https://randomuser.me/api/portraits/men/94.jpg'],
    verified: false,
    rating: 3.9,
    reviewCount: 2,
  },
];

// ── Seed function ─────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    const hashedPassword = await bcrypt.hash('Test@1234', 10);
    let created = 0;
    let skipped = 0;

    for (const u of testUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`⏭️  Skipped (already exists): ${u.name}`);
        skipped++;
        continue;
      }

      await User.create({
        ...u,
        password: hashedPassword,
        onboardingDone: true,
        isActive: true,
        role: 'user',
        avatar: u.photos[0],
      });
      console.log(`✅ Created: ${u.name} (${u.city})`);
      created++;
    }

    console.log(`\n🎉 Done! Created: ${created} | Skipped: ${skipped}`);
    console.log('📧 All test accounts password: Test@1234');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
