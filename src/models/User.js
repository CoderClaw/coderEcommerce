const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number },
    password: { type: String, required: true },
    cart: { type: Schema.Types.ObjectId, ref: 'Cart' },
    role: { type: String, default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

module.exports = model('User', UserSchema);