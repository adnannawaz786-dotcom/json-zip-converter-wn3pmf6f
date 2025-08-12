import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Upload, Download, FileText, Folder, FolderOpen, File } from 'lucide-react';

const FileConverter = () => {
  const [jsonData, setJsonData] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setError('Please select a valid JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        setJsonData(parsedData);
        setError('');
      } catch (err) {
        setError('Invalid JSON format');
        setJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  const generateFileStructure = (obj, path = '') => {
    const files = [];
    
    const processObject = (data, currentPath) => {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          const itemPath = `${currentPath}/item_${index}`;
          if (typeof item === 'object' && item !== null) {
            processObject(item, itemPath);
          } else {
            files.push({
              path: `${itemPath}.txt`,
              content: String(item)
            });
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          const newPath = currentPath ? `${currentPath}/${key}` : key;
          
          if (typeof value === 'object' && value !== null) {
            processObject(value, newPath);
          } else {
            const extension = typeof value === 'string' && value.length > 100 ? 'txt' : 'json';
            files.push({
              path: `${newPath}.${extension}`,
              content: extension === 'json' ? JSON.stringify(value, null, 2) : String(value)
            });
          }
        });
      } else {
        files.push({
          path: `${currentPath || 'data'}.txt`,
          content: String(data)
        });
      }
    };

    processObject(obj, path);
    return files;
  };

  const createZipFile = async (files) => {
    // Simple ZIP creation using browser APIs
    const JSZip = await import('https://cdn.skypack.dev/jszip');
    const zip = new JSZip.default();

    files.forEach(file => {
      zip.file(file.path, file.content);
    });

    return await zip.generateAsync({ type: 'blob' });
  };

  const handleConvert = async () => {
    if (!jsonData) return;

    setIsConverting(true);
    try {
      const files = generateFileStructure(jsonData);
      const zipBlob = await createZipFile(files);
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to create ZIP file');
    } finally {
      setIsConverting(false);
    }
  };

  const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { type: 'file', content: file.content };
        } else {
          if (!current[part]) {
            current[part] = { type: 'folder', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    
    return tree;
  };

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (tree, path = '') => {
    return Object.entries(tree).map(([name, node]) => {
      const currentPath = path ? `${path}/${name}` : name;
      
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath} className="ml-4">
            <div
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-100 rounded px-2"
              onClick={() => toggleFolder(currentPath)}
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-600" />
              ) : (
                <Folder className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm font-medium">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-4">
                {renderFileTree(node.children, currentPath)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div key={currentPath} className="ml-4">
            <div className="flex items-center gap-2 py-1 px-2">
              <File className="w-4 h-4 text-gray-600" />
              <span className="text-sm">{name}</span>
            </div>
          </div>
        );
      }
    });
  };

  const files = jsonData ? generateFileStructure(jsonData) : [];
  const fileTree = files.length > 0 ? buildFileTree(files) : {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">JSON to ZIP Converter</h1>
        <p className="text-gray-600">Convert your JSON files into organized ZIP archives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload JSON File
          </h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop your JSON file here, or click to browse</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select JSON File
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {jsonData && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-600 text-sm">JSON file loaded successfully!</p>
                <p className="text-gray-600 text-xs mt-1">
                  {files.length} files will be created
                </p>
              </div>
            )}

            <Button
              onClick={handleConvert}
              disabled={!jsonData || isConverting}
              className="w-full"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Convert to ZIP
                </>
              )}
            </Button>
          </div>
        </div>

        {/* File Tree Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Folder className="w-5 h-5" />
            File Structure Preview
          </h2>
          
          <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
            {Object.keys(fileTree).length > 0 ? (
              <div className="space-y-1">
                {renderFileTree(fileTree)}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Upload a JSON file to preview the file structure</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Upload a JSON file using the file picker above</li>
          <li>The converter will analyze your JSON structure and create a file tree</li>
          <li>Objects become folders, and values become individual files</li>
          <li>Click "Convert to ZIP" to download your organized file structure</li>
        </ol>
      </div>
    </div>
  );
};

export default FileConverter;