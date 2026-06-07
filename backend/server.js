require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crops', require('./routes/crops'));
app.use('/api/sell-requests', require('./routes/sellRequests'));
app.use('/api/service-requests', require('./routes/serviceRequests'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AgriConnect API is running', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.json({
    success: true, message: 'AgriConnect Backend Running'});
});
// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🌾 AGRICONNECT API SERVER STARTED   ║
  ║   Port: ${PORT}                           ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}          ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
