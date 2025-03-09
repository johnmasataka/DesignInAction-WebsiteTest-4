import mongoose from "mongoose";

// Define the User Context Schema
const userContextSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // ID
    preferences: { type: Object, default: {} }, // User preferences or contextual parameters
}, { timestamps: true }); // Automatic log of creation and update times

// Create and export models
const UserContext = mongoose.model('UserContext', userContextSchema);

export default UserContext;
