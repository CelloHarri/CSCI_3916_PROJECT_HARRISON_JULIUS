require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt.js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./Users');
const PantryItem = require('./PantryItem.js');

mongoose.connect(process.env.DB, { maxPoolSize: 50 })
    .then(async () => {
        console.log('Connected to MongoDB');
        await PantryItem.syncIndexes();
        console.log('Indexes synced');
    })
    .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const publicRouter = express.Router();
const privateRouter = express.Router();

publicRouter.post('/pantry/signup', async (req, res) => {
    if (!req.body.username || !req.body.password)
        return res.status(422).json({ success: false, message: 'Please Include Both Username and Password' });

    else if (!req.body.passwordConfirm)
        return res.status(422).json({ success: false, message: 'Passwords Do Not Match' });

    try {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });

        await user.save();

        res.status(200).json({ success: true, message: "Account Successfully Created" });
    } catch (err) {
        if (err.code === 11000)
            return res.status(409).json({ success: false, message: "Account with that username is already created" });
        else {
            console.error(err)
            return res.status(500).json({ success: false, message: "Something Went Wrong, Please Try Again Later" });
        }
    }
});

publicRouter.post('/pantry/signin', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username }).select('username password');

        if (!user)
            return res.status(401).json({ success: false, message: 'User Not Found' });

        const isMatch = await user.comparePassword(req.body.password);

        if (isMatch) {
            const userToken = { id: user._id, username: user.username };
            const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '2h' });
            res.json({ success: true, token: 'JWT ' + token });
        } else {
            res.status(401).json({ success: false, message: 'Incorrect Password' })
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Something Went Wrong, Please Try Again Later" });
    }
});

privateRouter.route('/pantry')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const items = await PantryItem.find({ userId: req.user._id });
            res.status(200).json({ success: true, pantryItems: items });
        } catch (err) {
            console.log(err)
            res.status(500).json({ success: false, message: 'Something went wrong' });
        }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
        if (!req.body.name || !req.body.category)
            return res.status(400).json({ success: false, message: 'Pantry Item Must include a name, and a category' });
        try {
            const pantryItem = new PantryItem({
                name: req.body.name,
                amount: req.body.amount ?? 1,
                amountAlert: req.body.amountAlert ?? null,
                criticalAlert: req.body.criticalAlert ?? false,
                quantity: req.body.quantity || null,
                expirationDate: req.body.expirationDate || null,
                category: req.body.category || 'Uncategorized',
                imageUrl: req.body.imageUrl || '',
                userId: req.user._id,
            });
            await pantryItem.save();
            res.status(200).json({ success: true, message: "Pantry Item Created", PantryItem: pantryItem });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .all(authJwtController.isAuthenticated, async (req, res) => {
        res.status(405).json({ success: false, message: "Non-Supported Action" });
    });

privateRouter.route('/pantry/:id')
    .get(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const item = await PantryItem.findOne({ _id: req.params.id, userId: req.user._id });
            if (!item)
                return res.status(404).json({ success: false, message: 'Pantry item not found' });
            res.status(200).json({ success: true, pantryItem: item });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .put(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const item = await PantryItem.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id },
                { $set: req.body },
                { new: true, runValidators: true }
            );
            if (!item)
                return res.status(404).json({ success: false, message: 'Pantry item not found' });
            res.status(200).json({ success: true, pantryItem: item });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .delete(authJwtController.isAuthenticated, async (req, res) => {
        try {
            const item = await PantryItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
            if (!item)
                return res.status(404).json({ success: false, message: 'Pantry item not found' });
            res.status(200).json({ success: true, message: 'Pantry item deleted' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    })
    .all(authJwtController.isAuthenticated, (req, res) => {
        res.status(405).json({ success: false, message: 'Non-Supported Action' });
    });


app.use('/api/public', publicRouter);
app.use('/api/private', privateRouter);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Cloudflare Tunnel keeps connections alive for ~90s; Node.js defaults to 5s.
// If Node closes a connection Cloudflare still considers open, the next request
// on that connection fails for all clients until the stale state clears.
server.keepAliveTimeout = 120000; // 120s — above Cloudflare's ~90s window
server.headersTimeout = 121000;   // must be strictly greater than keepAliveTimeout