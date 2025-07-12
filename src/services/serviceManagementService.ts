
// This file now re-exports everything from the refactored service modules
// to maintain backward compatibility with existing imports

export {
  getServices,
  getUserServices,
  getService,
  getAllServices,
  updateServiceStatus,
  deleteService
} from './service';
