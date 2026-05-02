const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PantryItemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    amount: Number,
    amountAlert: Number,
    criticalAlert: Number,
    quantity: {
        type: String,
        enum: [
            'lbs', 'grams', 'oz', 'count', 'kilograms', ''
        ]
    },
    expirationDate: Date,
    category: String,
    amountAlert: { type: Number, default: null },
    criticalAlert: { type: Boolean, default: false },
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true}, //Looks at User ObjectID
    imageUrl: String,
});

module.exports = mongoose.model('PantryItem', PantryItemSchema)