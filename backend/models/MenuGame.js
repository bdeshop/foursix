const mongoose = require('mongoose');

const menuGameSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameCategory',
        required: true
    },
    categoryname: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    gameId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const MenuGame = mongoose.model('MenuGame', menuGameSchema);

module.exports = MenuGame;