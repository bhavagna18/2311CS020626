let vehicles = [];

const createVehicle = async (vehicle) => {
  vehicles.push(vehicle);
  return vehicle;
};

const getVehicles = async () => {
  return vehicles;
};

module.exports = {
  createVehicle,
  getVehicles,
};
