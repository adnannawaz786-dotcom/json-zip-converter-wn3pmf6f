
/**
 * Validates if a string is valid JSON
 * @param {string} jsonString - The JSON string to validate
 * @returns {boolean} - True if valid JSON, false otherwise
 */
export const isValidJSON = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Parses JSON string and returns the parsed object
 * @param {string} jsonString - The JSON string to parse
 * @returns {Object|null} - Parsed JSON object or null if invalid
 */
export const parseJSON = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

/**
 * Sanitizes filename to be safe for file systems
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .trim();
};

/**
 * Creates a file tree structure from JSON data
 * @param {Object} data - The JSON data to convert
 * @param {string} basePath - Base path for the files
 * @returns {Object} - File tree structure
 */
export const createFileTree = (data, basePath = '') => {
  const fileTree = {};
  
  const processNode = (obj, currentPath) => {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const itemPath = `${currentPath}/item_${index}`;
        if (typeof item === 'object' && item !== null) {
          processNode(item, itemPath);
        } else {
          fileTree[`${itemPath}.txt`] = String(item);
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const sanitizedKey = sanitizeFilename(key);
        const newPath = currentPath ? `${currentPath}/${sanitizedKey}` : sanitizedKey;
        
        if (typeof value === 'object' && value !== null) {
          processNode(value, newPath);
        } else {
          fileTree[`${newPath}.txt`] = String(value);
        }
      });
    } else {
      fileTree[`${currentPath || 'data'}.txt`] = String(obj);
    }
  };

  processNode(data, basePath);
  return fileTree;
};

/**
 * Creates a hierarchical file tree structure for display
 * @param {Object} fileTree - Flat file tree object
 * @returns {Array} - Hierarchical tree structure
 */
export const createHierarchicalTree = (fileTree) => {
  const tree = [];
  const pathMap = new Map();

  Object.keys(fileTree).forEach(filePath => {
    const parts = filePath.split('/');
    let currentLevel = tree;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      
      let existingNode = currentLevel.find(node => node.name === part);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? fileTree[filePath] : undefined
        };
        currentLevel.push(existingNode);
        pathMap.set(currentPath, existingNode);
      }
      
      if (!isFile) {
        currentLevel = existingNode.children;
      }
    });
  });

  return tree;
};

/**
 * Converts JSON to ZIP file
 * @param {Object} jsonData - The JSON data to convert
 * @param {string} zipName - Name for the ZIP file
 * @returns {Promise<Blob>} - Promise that resolves to ZIP file blob
 */
export const convertJSONToZip = async (jsonData, zipName = 'converted_files') => {
  try {
    const zip = new JSZip();
    const fileTree = createFileTree(jsonData);
    
    // Add files to ZIP
    Object.entries(fileTree).forEach(([filePath, content]) => {
      zip.file(filePath, content);
    });
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
    
    return zipBlob;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw new Error('Failed to create ZIP file');
  }
};

/**
 * Downloads a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Counts total files in a file tree
 * @param {Object} fileTree - The file tree object
 * @returns {number} - Total number of files
 */
export const countFiles = (fileTree) => {
  return Object.keys(fileTree).length;
};

/**
 * Gets file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

/**
 * Validates ZIP file name
 * @param {string} filename - The filename to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidZipName = (filename) => {
  const validPattern = /^[a-zA-Z0-9_\-\s]+$/;
  return validPattern.test(filename) && filename.trim().length > 0;
};