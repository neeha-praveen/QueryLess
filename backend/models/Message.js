// models/Message.js
const { Schema, model } = require('mongoose');

const MessageSchema = new Schema({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: String, enum: ['user','bot','system'], required: true },
  text: { type: String },
  meta: { type: Schema.Types.Mixed }, // for attachments, ocr result, etc.
  createdAt: { type: Date, default: () => new Date() },
});

module.exports = model('Message', MessageSchema);
