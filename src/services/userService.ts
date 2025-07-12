

// Fix the imports to match the actual exported functions
import {
  getUserProfile,
  updateUserProfile,
  updateFiscalData,
  getAllUserProfiles
} from './user/profileService';

import {
  createUser,
  getUserById as getUserByAdmin,
  deleteUser,
  updateUser,
  getUserById,
  getAllUsers,
  updateUserRole,
  updateUserByAdmin
} from './user/adminUserService';

// Export type UserRole
export type { UserRole } from '@/types/admin-auth';

// Export the functions with the correct names
export {
  // Functions from profileService
  getUserProfile,
  updateUserProfile,
  updateFiscalData,
  getAllUserProfiles,
  
  // Functions from adminUserService
  createUser,
  updateUserByAdmin,
  getUserByAdmin,
  deleteUser,
  updateUser,
  getUserById,
  getUserById as getUserByEmail,
  getAllUsers,
  updateUserRole
};

