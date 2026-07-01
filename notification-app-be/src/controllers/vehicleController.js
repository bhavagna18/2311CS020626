const vehicleService = require('../services/vehicleService');

const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getVehicles();
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
};
