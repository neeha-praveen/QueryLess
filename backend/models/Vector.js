const mongoose = require('mongoose');

const VectorSchema = new mongoose.Schema({
  content: String,
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Vector', VectorSchema);
