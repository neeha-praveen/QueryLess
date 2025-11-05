require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const schemaRoutes = require('./routes/schema');
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const queryRoutes = require("./routes/queryRoutes");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function start() {
  // Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Start server
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes);
  app.use('/api/schema', schemaRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/messages", messageRoutes);
  app.use('/api/query', queryRoutes);

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
