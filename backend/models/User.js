const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  name: String,
  schemaName: String,        // actual postgres schema created
  schemaDef: Object,         // JSON definition (tables, columns)
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  workspaces: [WorkspaceSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
