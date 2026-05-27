/**
 * seed_atlas.js
 * Chạy: node seed_atlas.js
 * Import toàn bộ dữ liệu từ seed_data.json lên MongoDB Atlas
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb+srv://bd_user:MsRCpeygoQ8dt8rA@cluster0.w1if19z.mongodb.net/product_db';

// ── Schemas ────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, default: 'user' }
});

const ProductSchema = new mongoose.Schema({
    name:           String,
    description:    String,
    pr:             Number,
    image:          [String],
    category:       String,
    specifications: [{ key: String, value: String }],
    Gb:             [{ label: String, price: Number }],
    variants:       [{ colorName: String, colorCode: String, img: String }]
});

const User    = mongoose.model('User',    UserSchema);
const Iphone  = mongoose.model('Iphone',  ProductSchema, 'iphone');
const Ipad    = mongoose.model('Ipad',    ProductSchema, 'ipad');
const Macbook = mongoose.model('Macbook', ProductSchema, 'macbook');
const Airpod  = mongoose.model('Airpod',  ProductSchema, 'airpods');

// ── Main ───────────────────────────────────────────────────────────────────
async function seed() {
    console.log('Kết nối MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Đã kết nối!\n');

    // Đọc file seed
    const dataPath = path.join(__dirname, 'seed_data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // ── Users ──────────────────────────────────────────────────────────────
    console.log('Xóa users cũ...');
    await User.deleteMany({});

    console.log('Seed users...');
    for (const u of data.users) {
        const hashed = await bcrypt.hash(u.password, 10);
        await User.create({ email: u.email, password: hashed, role: u.role });
        console.log(`  ✅ ${u.email} (${u.role})`);
    }

    // ── Products ───────────────────────────────────────────────────────────
    const models = {
        iphone:  Iphone,
        ipad:    Ipad,
        macbook: Macbook,
        airpods: Airpod,
    };

    for (const [col, Model] of Object.entries(models)) {
        console.log(`\nXóa ${col} cũ...`);
        await Model.deleteMany({});

        console.log(`Seed ${col} (${data[col]?.length || 0} sản phẩm)...`);
        if (data[col]?.length) {
            await Model.insertMany(data[col]);
            console.log(`  ✅ ${data[col].length} sản phẩm`);
        }
    }

    console.log('\n══════════════════════════════');
    console.log('  SEED HOÀN TẤT!');
    console.log('══════════════════════════════');
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
});
