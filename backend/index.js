require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspace');
const schemaRoutes = require('./routes/schema');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

async function start() {
  // Connect MongoDB
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('Connected to MongoDB');

  // Start server
  app.use('/api/auth', authRoutes);
  app.use('/api/workspace', workspaceRoutes); 
  app.use('/api/schema', schemaRoutes);

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start', err);
  process.exit(1);
});
