/**
 * Tree utility functions for file tree operations
 */

/**
 * Flattens a hierarchical tree structure into a flat array
 * @param {Object} tree - The tree object to flatten
 * @param {string} parentPath - The parent path for the current node
 * @returns {Array} Flattened array of file objects
 */
export function flattenTree(tree, parentPath = '') {
  const result = [];
  
  if (!tree || typeof tree !== 'object') {
    return result;
  }

  Object.keys(tree).forEach(key => {
    const currentPath = parentPath ? `${parentPath}/${key}` : key;
    const value = tree[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // It's a directory
      result.push({
        name: key,
        path: currentPath,
        type: 'directory',
        children: Object.keys(value).length
      });
      
      // Recursively flatten children
      result.push(...flattenTree(value, currentPath));
    } else {
      // It's a file
      result.push({
        name: key,
        path: currentPath,
        type: 'file',
        content: value
      });
    }
  });

  return result;
}

/**
 * Gets all file paths from a tree structure
 * @param {Object} tree - The tree object
 * @param {string} basePath - Base path prefix
 * @returns {Array} Array of file paths
 */
export function getFilePaths(tree, basePath = '') {
  const paths = [];
  
  if (!tree || typeof tree !== 'object') {
    return paths;
  }

  Object.keys(tree).forEach(key => {
    const currentPath = basePath ? `${basePath}/${key}` : key;
    const value = tree[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Directory - recurse
      paths.push(...getFilePaths(value, currentPath));
    } else {
      // File
      paths.push(currentPath);
    }
  });

  return paths;
}

/**
 * Gets all directory paths from a tree structure
 * @param {Object} tree - The tree object
 * @param {string} basePath - Base path prefix
 * @returns {Array} Array of directory paths
 */
export function getDirectoryPaths(tree, basePath = '') {
  const paths = [];
  
  if (!tree || typeof tree !== 'object') {
    return paths;
  }

  Object.keys(tree).forEach(key => {
    const currentPath = basePath ? `${basePath}/${key}` : key;
    const value = tree[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Directory
      paths.push(currentPath);
      paths.push(...getDirectoryPaths(value, currentPath));
    }
  });

  return paths;
}

/**
 * Finds a node in the tree by path
 * @param {Object} tree - The tree object
 * @param {string} path - The path to find
 * @returns {Object|null} The found node or null
 */
export function findNodeByPath(tree, path) {
  if (!tree || !path) {
    return null;
  }

  const pathParts = path.split('/').filter(part => part.length > 0);
  let current = tree;

  for (const part of pathParts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return null;
    }
    current = current[part];
  }

  return current;
}

/**
 * Gets the depth of a tree structure
 * @param {Object} tree - The tree object
 * @returns {number} Maximum depth of the tree
 */
export function getTreeDepth(tree) {
  if (!tree || typeof tree !== 'object') {
    return 0;
  }

  let maxDepth = 0;

  Object.values(tree).forEach(value => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const depth = 1 + getTreeDepth(value);
      maxDepth = Math.max(maxDepth, depth);
    }
  });

  return maxDepth;
}

/**
 * Counts total number of files in a tree
 * @param {Object} tree - The tree object
 * @returns {number} Total file count
 */
export function countTreeFiles(tree) {
  if (!tree || typeof tree !== 'object') {
    return 0;
  }

  let count = 0;

  Object.values(tree).forEach(value => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Directory - recurse
      count += countTreeFiles(value);
    } else {
      // File
      count += 1;
    }
  });

  return count;
}

/**
 * Counts total number of directories in a tree
 * @param {Object} tree - The tree object
 * @returns {number} Total directory count
 */
export function countTreeDirectories(tree) {
  if (!tree || typeof tree !== 'object') {
    return 0;
  }

  let count = 0;

  Object.values(tree).forEach(value => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Directory
      count += 1;
      count += countTreeDirectories(value);
    }
  });

  return count;
}

/**
 * Gets tree statistics
 * @param {Object} tree - The tree object
 * @returns {Object} Statistics object
 */
export function getTreeStats(tree) {
  return {
    files: countTreeFiles(tree),
    directories: countTreeDirectories(tree),
    depth: getTreeDepth(tree),
    totalNodes: countTreeFiles(tree) + countTreeDirectories(tree)
  };
}

/**
 * Sorts tree keys alphabetically with directories first
 * @param {Object} tree - The tree object
 * @returns {Object} Sorted tree
 */
export function sortTree(tree) {
  if (!tree || typeof tree !== 'object') {
    return tree;
  }

  const sorted = {};
  const directories = [];
  const files = [];

  // Separate directories and files
  Object.keys(tree).forEach(key => {
    const value = tree[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      directories.push(key);
    } else {
      files.push(key);
    }
  });

  // Sort both arrays
  directories.sort();
  files.sort();

  // Add directories first (recursively sorted)
  directories.forEach(key => {
    sorted[key] = sortTree(tree[key]);
  });

  // Add files
  files.forEach(key => {
    sorted[key] = tree[key];
  });

  return sorted;
}

/**
 * Validates if an object is a valid tree structure
 * @param {*} obj - Object to validate
 * @returns {boolean} True if valid tree structure
 */
export function isValidTree(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }

  try {
    return Object.values(obj).every(value => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Directory - validate recursively
        return isValidTree(value);
      }
      // File - can be any value
      return true;
    });
  } catch (error) {
    return false;
  }
}

/**
 * Creates a tree structure from an array of file paths
 * @param {Array} paths - Array of file paths
 * @param {*} defaultContent - Default content for files
 * @returns {Object} Tree structure
 */
export function createTreeFromPaths(paths, defaultContent = '') {
  const tree = {};

  paths.forEach(path => {
    if (!path || typeof path !== 'string') return;

    const parts = path.split('/').filter(part => part.length > 0);
    let current = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // File
        current[part] = defaultContent;
      } else {
        // Directory
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });

  return tree;
}