const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
app.use(cors());

const SECRET_KEY = "Ngoclan@267204"; // Dùng để mã hóa Token

// 1. KẾT NỐI DATABASE (Sử dụng MongoDB Local)
mongoose.connect('mongodb://127.0.0.1:27017/product_db')
    .then(() => console.log("Đã kết nối MongoDB"))
    .catch(err => console.error("Lỗi kết nối DB:", err));

// 2. ĐỊNH NGHĨA SCHEMA (Cấu trúc dữ liệu)
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{type:String,default:'user'}
});
const User = mongoose.model('User', UserSchema);
const contactSchema = new mongoose.Schema({
    name:String,
    phone:String,
    message:String,
    createdAt:{type: Date, default:Date.now}
});
const Contact = mongoose.model('Contact', contactSchema);
const ProductSchema = new mongoose.Schema({
    name: String,
    description: String,
    pr:Number,
    image:[String],
    category:String,
    specifications: [{ 
        key: String, 
        value: String 
    }],
    Gb: [{ label: String, price: Number }], 
    variants: [{ colorName: String, colorCode: String, img: String }]
});
const Iphone =mongoose.model('Iphone', ProductSchema,'iphone');
const Ipad = mongoose.model('Ipad', ProductSchema, 'ipad');
const Macbook=mongoose.model('Macbook',ProductSchema,'macbook');
const Airpod=mongoose.model('Airpod',ProductSchema,'airpods');

// 3. API ĐĂNG KÝ (Tạo tài khoản mẫu để test)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            email, 
            password: hashedPassword, 
            role: role || 'user' 
        });
        await newUser.save();
        res.json({ message: "Đăng ký thành công!" });
    } catch (err) { res.status(400).json({ message: "Email đã tồn tại" }); }
});

// 4. API ĐĂNG NHẬP (Login)
app.post('/api/auth/login', async (req, res) => {
    const email    = req.body.email    || req.body.userEmail;
    const password = req.body.password || req.body.userPass;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, email: user.email, role:user.role });
});
const checkAdmin=(req, res, next)=>{
    const token=req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({message:"Bạn cần đăng nhập lại!"});
    try{
        const decoded = jwt.verify(token,SECRET_KEY);
        if(decoded.role!=='admin'){
            return res.status(403).json({message:"Chỉ Admin mới có quyền này!"})
        }
        req.user=decoded;
        next();
    }
    catch(err){
        res.status(401).json({message:"Phiên bản đăng nhập hết hạn!"});
    }
};

// 5. API CRUD SẢN PHẨM
app.get('/api/products', async (req, res) => {
    try{
        const [iphones, ipads, macbooks, airpods]= await Promise.all([
            Iphone.find(),
            Ipad.find(),
            Macbook.find(),
            Airpod.find()
        ]);
        const allProducts=[
            ...iphones.map(p=>({...p._doc,category:'iphone'})),
            ...ipads.map(p=>({...p._doc,category:'ipad'})),
            ...macbooks.map(p=>({...p._doc,category:'macbook'})),
            ...airpods.map(p=>({...p._doc,category:'airpods'}))
        ];
        res.json(allProducts);
    }
    catch(err){
        res.status(500).json({message:"Lỗi lấy dữ liệu ..."});
    }
});
const getModel = (category) => {
    const cat = category.toLowerCase();
    if (cat === 'iphone') return Iphone;
    if (cat === 'ipad') return Ipad;
    if (cat === 'macbook') return Macbook;
    if (cat === 'airpods') return Airpod;
    return null;
};
app.get('/api/products/:category/:id',async(req,res)=>{
    const Model = getModel(req.params.category);
    if (!Model) return res.status(400).json({ message: "Danh mục sai" });

    try {
        const product = await Model.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy" });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: "Lỗi Server" });
    }
});
app.get('/api/admin/contacts',checkAdmin,async(req,res)=>{
    try{
        const contacts= await Contact.find().sort({createdAt:-1});
        res.json(contacts);
    }
    catch(err){
        res.status(500).json({message:"Không thể lấy thông tin liên hệ"});
    }
});
app.post('/api/products/:category',checkAdmin, async (req, res) => {
    const{category}=req.params;
    let Model;
    switch (category){
        case 'iphone':Model = Iphone;break;
        case 'ipad': Model=Ipad;break;
        case 'macbook':Model=Macbook;break;
        case 'airpods':Model=Airpod;break;
        default: return res.status(400).json({message:"Danh mục không hợp lệ!"});
    }
    try{
        const newProduct =new Model(req.body);
        await newProduct.save();
        res.status(201).json(newProduct);
    }
    catch(err){
        res.status(400).json({message:"Lỗi khi thêm sản phẩm"})
    }
});
app.post('/api/contact', async (req, res) => {
    try {
        const newEntry = new Contact(req.body); 
        await newEntry.save();
        res.status(201).json({ message: "Gửi thông tin thành công!" });
    } catch (err) {
        console.error("Lỗi liên hệ:", err);
        res.status(500).json({ message: "Lỗi máy chủ khi lưu thông tin" });
    }
});
app.delete('/api/products/:category/:id', checkAdmin, async (req, res) => {
    const {category,id}=req.params;
    let Model;
    switch(category){
        case 'iphone':Model=Iphone;break;
        case 'ipad':Model=Ipad;break;
        case 'macbook':Model=Macbook;break;
        case 'airpods':Model=Airpod;break;
        default: return res.status(400).json({message:"Danh mục không hợp lệ!"});
    }
    try{
        const deletedProduct=await Model.findByIdAndDelete(id);
        if(!deletedProduct){
            return res.status(404).json({message:"Không tìm thấy sản phẩm để xóa!"})
        }res.json({message:'Đã xóa sản phẩm!'})
    }
    catch(err){
        res.status(500).json({message:"Lỗi khi xóa sản phẩm"})
    }
});
app.delete("/api/admin/contacts/:id",checkAdmin,async(req,res)=>{
    try{
        await Contact.findByIdAndDelete(req.params.id);
        res.json({message:"Đã xóa yêu cầu liên hệ"});
    }
    catch(err){
        res.status(500).json({message:"Lỗi khi xóa"});
    }
});
app.put('/api/products/:category/:id', checkAdmin,async(req,res)=>{
    const {category, id}= req.params;
    const Model=getModel(category);
    if(!Model) return res.status(400).json({message:"Danh mục không hợp lệ!"});
    try{
        const updateProduct= await Model.findByIdAndUpdate(id, req.body, {new: true});
        if(!updateProduct){
            return res.status(404).json({message: "Không tìm thấy sản phẩm!"});
        }
        res.json(updateProduct);
    }
    catch (err){
        console.error("Lỗi cập nhật:",err);
        res.status(500).json({massage:"Lỗi khi cập nhật sản phẩm!"});
    }
});
// CHẠY SERVER
const PORT = 5000;
app.listen(PORT, () => console.log(`Server chạy tại: http://localhost:${PORT}`));
