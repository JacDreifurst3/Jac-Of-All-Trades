const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db'); 

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes (add game/auth routes here soon)
app.get('/', (req, res) => {
    res.send('API is running');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});