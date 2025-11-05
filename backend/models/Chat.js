// models/Chat.js
const { Schema, model } = require('mongoose');

const ChatSchema = new Schema({
  title: { type: String, default: 'New chat' },
  userId: { type: String, default: null }, // if you add auth later
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
  // optional: keep latest message preview
  lastMessage: { type: String, default: '' },
});

ChatSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

module.exports = model('Chat', ChatSchema);
