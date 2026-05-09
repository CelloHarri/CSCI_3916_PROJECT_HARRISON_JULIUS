const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PantryItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: Number,
    quantity: {
        type: String,
        enum: [
            'count', 'oz', 'lbs', 'milligrams', 'grams', 'kilograms', 'milliliters', 'liters', null
        ]
    },
    expirationDate: Date,
    category: String,
    amountAlert: { type: Number, default: null },
    criticalAlert: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, //Looks at User ObjectID
    imageUrl: String,
});

PantryItemSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PantryItem', PantryItemSchema)