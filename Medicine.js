const mongoose = require('mongoose');

// Dawai (Medicine) ka Data Structure
const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true // Dawai ka naam lazmi hai
    },
    formula: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true // Kitni dawaiyan bachi hain
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, { timestamps: true }); // Entry kis time save hui, database khud record karega

// Is schema ko export karna taake server isay use kar sake
module.exports = mongoose.model('Medicine', medicineSchema);