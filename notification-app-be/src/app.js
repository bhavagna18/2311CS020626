const express = require('express');
const dotenv = require('dotenv');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notificationRoutes = require('./routes/notificationRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const indexRouter = require('./routes/index');

dotenv.config();

const app = express();

app.use(express.json());
app.use(logger);

app.use('/', indexRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.use(errorHandler);

module.exports = app;
