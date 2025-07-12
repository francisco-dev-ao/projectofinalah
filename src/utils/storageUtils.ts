
export const storageUtils = {
  uploadFile: async (file: File, path: string) => {
    console.log('Upload file called', { file, path });
    return { success: true, url: 'mock-url' };
  },
  ensureStorageBucket: async (bucketName?: string) => {
    console.log('ensureStorageBucket called', { bucketName });
    return { success: true };
  }
};

export const ensureStorageBucket = async (bucketName?: string) => {
  console.log('ensureStorageBucket called', { bucketName });
  return { success: true };
};

// Export individual functions for direct import
export async function uploadFile(file: File, path: string) {
  console.log('Upload file called', { file, path });
  return { success: true, url: 'mock-url' };
}

export default storageUtils;
