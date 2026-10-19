const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

const DB_LINK = 'mongodb://hammadfareed485_db_user:Hammad485@ac-0jlbmqv-shard-00-00.ojctxsp.mongodb.net:27017,ac-0jlbmqv-shard-00-01.ojctxsp.mongodb.net:27017,ac-0jlbmqv-shard-00-02.ojctxsp.mongodb.net:27017/?ssl=true&replicaSet=atlas-14hrs2-shard-0&authSource=admin';

mongoose.connect(DB_LINK).then(() => console.log("Database Connected.")).catch((err) => console.log(err));

const medicineSchema = new mongoose.Schema({ name: String, formula: String, price: Number, stock: Number, expiryDate: String, imageUrl: String });
const Medicine = mongoose.model('Medicine', medicineSchema);

const orderSchema = new mongoose.Schema({ 
    customerName: String, 
    phone: String, 
    address: String, 
    items: Array, 
    totalBill: Number, 
    paymentMethod: String, 
    transactionId: String,
    prescriptionUrl: String,
    status: { type: String, default: 'Pending' } 
});
const Order = mongoose.model('Order', orderSchema);

app.post('/api/admin/login', (req, res) => {
    if (req.body.email === 'hammadfareed876@gmail.com' && req.body.password === 'admin123') res.status(200).json({ success: true });
    else res.status(401).json({ success: false });
});

app.post('/api/medicines', upload.single('image'), async (req, res) => {
    try {
        let imageUrl = req.body.imageUrl || "";
        if (req.file) {
            imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        const dawai = new Medicine({ ...req.body, imageUrl }); 
        await dawai.save(); 
        res.status(201).json(dawai); 
    } catch (e) { res.status(400).json({ error: "Error" }); }
});

// EDIT / UPDATE MEDICINE ROUTE
app.put('/api/medicines/:id', upload.single('image'), async (req, res) => {
    try {
        let updateData = {
            name: req.body.name,
            formula: req.body.formula,
            price: req.body.price,
            stock: req.body.stock,
            expiryDate: req.body.expiryDate
        };
        if (req.body.imageUrl) {
            updateData.imageUrl = req.body.imageUrl;
        }
        if (req.file) {
            updateData.imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        const updatedMedicine = await Medicine.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json(updatedMedicine);
    } catch (e) {
        res.status(400).json({ error: "Update error" });
    }
});

app.get('/api/medicines', async (req, res) => {
    try { res.status(200).json(await Medicine.find().sort({ _id: -1 })); } catch (e) { res.status(400).json({ error: "Error" }); }
});

app.delete('/api/medicines/:id', async (req, res) => {
    try { await Medicine.findByIdAndDelete(req.params.id); res.status(200).json({ message: "Deleted" }); } catch (e) { res.status(400).json({ error: "Error" }); }
});

app.post('/api/orders', upload.single('prescription'), async (req, res) => {
    try {
        let prescriptionUrl = "";
        if (req.file) {
            prescriptionUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        let items = req.body.items;
        if (typeof items === 'string') {
            items = JSON.parse(items);
        }
        const order = new Order({
            customerName: req.body.customerName,
            phone: req.body.phone,
            address: req.body.address,
            items: items,
            totalBill: Number(req.body.totalBill),
            paymentMethod: req.body.paymentMethod,
            transactionId: req.body.transactionId || "",
            prescriptionUrl: prescriptionUrl
        });
        await order.save();
        for (let item of items) {
            const dawai = await Medicine.findById(item._id);
            if (dawai) { 
                dawai.stock -= Number(item.cartQuantity); 
                await dawai.save(); 
            }
        }
        res.status(201).json({ message: "Success" });
    } catch (e) { 
        res.status(400).json({ error: e.message }); 
    }
});

app.get('/api/orders', async (req, res) => {
    try { res.status(200).json(await Order.find().sort({ _id: -1 })); } catch (e) { res.status(400).json({ error: "Error" }); }
});

app.put('/api/orders/status/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id); order.status = req.body.status; await order.save();
        res.status(200).json({ message: "Updated" });
    } catch (e) { res.status(400).json({ error: "Error" }); }
});

app.put('/api/medicines/sell/:id', async (req, res) => {
    try {
        const { quantityToSell } = req.body;
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine || medicine.stock < quantityToSell) return res.status(400).json({ error: "Stock error" });
        medicine.stock -= quantityToSell; await medicine.save();
        res.status(200).json({ totalBill: quantityToSell * medicine.price });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.get('/api/seed-medicines', async (req, res) => {
    const realPills = "https://images.unsplash.com/photo-1584308666744-24d5e4b6c310?auto=format&fit=crop&w=500&q=80";
    const realSyrup = "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=500&q=80";
    const realCream = "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500&q=80";
    const realAid = "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=500&q=80";
    const realDrops = "https://images.unsplash.com/photo-1611078449942-026859e21820?auto=format&fit=crop&w=500&q=80";

    const seedData = [
        { name: "Panadol 500mg", formula: "Paracetamol", price: 30, stock: 500, expiryDate: "2026-12-31", imageUrl: realPills },
        { name: "Brufen Syrup", formula: "Ibuprofen", price: 75, stock: 150, expiryDate: "2025-10-10", imageUrl: realSyrup },
        { name: "Augmentin 625mg", formula: "Amoxicillin + Clavulanate", price: 250, stock: 100, expiryDate: "2026-10-15", imageUrl: realPills },
        { name: "Pyodine Solution 10%", formula: "Povidone Iodine", price: 120, stock: 200, expiryDate: "2028-05-01", imageUrl: realAid },
        { name: "Gaviscon Syrup", formula: "Sodium Alginate", price: 180, stock: 100, expiryDate: "2025-11-30", imageUrl: realSyrup },
        { name: "Betnovate Cream", formula: "Betamethasone", price: 95, stock: 250, expiryDate: "2026-10-30", imageUrl: realCream },
        { name: "Systane Ultra", formula: "Lubricant Eye Drops", price: 450, stock: 80, expiryDate: "2025-12-10", imageUrl: realDrops },
        { name: "Surbex Z", formula: "Multivitamin + Zinc", price: 320, stock: 200, expiryDate: "2026-10-10", imageUrl: realPills },
        { name: "Saniplast Bandage", formula: "Adhesive Bandage", price: 50, stock: 1000, expiryDate: "2030-01-01", imageUrl: realAid },
        { name: "Rigix 10mg", formula: "Cetirizine", price: 70, stock: 250, expiryDate: "2026-04-10", imageUrl: realPills }
    ];

    try {
        await Medicine.deleteMany({});
        await Medicine.insertMany(seedData);
        res.status(200).json({ message: "Medicines added successfully!" });
    } catch (e) { res.status(500).json({ error: "Seed Error" }); }
});

app.listen(5000, () => console.log("Backend ON."));