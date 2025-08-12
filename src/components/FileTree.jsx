import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

const FileTreeNode = ({ node, depth = 0, onToggle, expandedNodes }) => {
  const isExpanded = expandedNodes.has(node.path);
  const hasChildren = node.children && node.children.length > 0;
  const isFile = node.type === 'file';

  const handleToggle = () => {
    if (hasChildren) {
      onToggle(node.path);
    }
  };

  const getIcon = () => {
    if (isFile) {
      return <File className="w-4 h-4 text-blue-500" />;
    }
    return isExpanded ? 
      <FolderOpen className="w-4 h-4 text-yellow-600" /> : 
      <Folder className="w-4 h-4 text-yellow-600" />;
  };

  const getFileExtension = (filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const getFileTypeColor = (filename) => {
    const ext = getFileExtension(filename);
    const colorMap = {
      'js': 'text-yellow-500',
      'jsx': 'text-blue-400',
      'ts': 'text-blue-600',
      'tsx': 'text-blue-500',
      'json': 'text-green-500',
      'html': 'text-orange-500',
      'css': 'text-pink-500',
      'md': 'text-gray-600',
      'txt': 'text-gray-500',
      'png': 'text-purple-500',
      'jpg': 'text-purple-500',
      'jpeg': 'text-purple-500',
      'gif': 'text-purple-500',
      'svg': 'text-indigo-500'
    };
    return colorMap[ext] || 'text-gray-600';
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 hover:bg-gray-100 rounded cursor-pointer transition-colors duration-150 ${
          depth === 0 ? 'font-medium' : ''
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleToggle}
      >
        <div className="flex items-center min-w-0 flex-1">
          {hasChildren && (
            <div className="mr-1 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-5 mr-1 flex-shrink-0" />}
          
          <div className="mr-2 flex-shrink-0">
            {getIcon()}
          </div>
          
          <span 
            className={`truncate text-sm ${
              isFile ? getFileTypeColor(node.name) : 'text-gray-800'
            }`}
            title={node.name}
          >
            {node.name}
          </span>
          
          {isFile && (
            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
              {node.size ? formatFileSize(node.size) : ''}
            </span>
          )}
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-2">
          {node.children.map((child, index) => (
            <FileTreeNode
              key={`${child.path}-${index}`}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const FileTree = ({ data, className = '' }) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const handleToggle = (path) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allPaths = new Set();
    const collectPaths = (node) => {
      if (node.children && node.children.length > 0) {
        allPaths.add(node.path);
        node.children.forEach(collectPaths);
      }
    };
    if (data) {
      if (Array.isArray(data)) {
        data.forEach(collectPaths);
      } else {
        collectPaths(data);
      }
    }
    setExpandedNodes(allPaths);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getTotalStats = () => {
    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;

    const countNodes = (node) => {
      if (node.type === 'file') {
        fileCount++;
        totalSize += node.size || 0;
      } else {
        folderCount++;
      }
      if (node.children) {
        node.children.forEach(countNodes);
      }
    };

    if (data) {
      if (Array.isArray(data)) {
        data.forEach(countNodes);
      } else {
        countNodes(data);
      }
    }

    return { fileCount, folderCount, totalSize };
  };

  if (!data) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No files to display</p>
        <p className="text-sm">Upload a JSON file to see the file tree</p>
      </div>
    );
  }

  const stats = getTotalStats();
  const rootNodes = Array.isArray(data) ? data : [data];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">File Tree</h3>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Folder className="w-4 h-4" />
            {stats.folderCount} folders
          </span>
          <span className="flex items-center gap-1">
            <File className="w-4 h-4" />
            {stats.fileCount} files
          </span>
          {stats.totalSize > 0 && (
            <span className="text-gray-500">
              {formatFileSize(stats.totalSize)}
            </span>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto p-2">
        {rootNodes.map((node, index) => (
          <FileTreeNode
            key={`${node.path || node.name}-${index}`}
            node={node}
            onToggle={handleToggle}
            expandedNodes={expandedNodes}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;