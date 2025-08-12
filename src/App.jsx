import React, { useState, useCallback } from 'react';
import { Button } from './components/ui/Button';
import { Upload, Download, FileText, Folder, FolderOpen, File, X, Plus, Trash2 } from 'lucide-react';

function App() {
  const [jsonInput, setJsonInput] = useState('');
  const [fileStructure, setFileStructure] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const parseJsonToFileStructure = useCallback((jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      const createFileStructure = (obj, path = '') => {
        const structure = {};
        
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}/${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            structure[key] = {
              type: 'folder',
              path: currentPath,
              children: createFileStructure(value, currentPath)
            };
          } else {
            const content = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
            const extension = key.includes('.') ? '' : '.json';
            structure[key + extension] = {
              type: 'file',
              path: currentPath + extension,
              content: content
            };
          }
        }
        
        return structure;
      };
      
      return createFileStructure(data);
    } catch (err) {
      throw new Error('Invalid JSON format');
    }
  }, []);

  const handleJsonInput = useCallback((value) => {
    setJsonInput(value);
    setError('');
    
    if (value.trim()) {
      try {
        const structure = parseJsonToFileStructure(value);
        setFileStructure(structure);
      } catch (err) {
        setError(err.message);
        setFileStructure(null);
      }
    } else {
      setFileStructure(null);
    }
  }, [parseJsonToFileStructure]);

  const toggleFolder = useCallback((path) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const generateZip = useCallback(async () => {
    if (!fileStructure) return;
    
    setIsProcessing(true);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      const addToZip = (structure, currentZip = zip) => {
        for (const [name, item] of Object.entries(structure)) {
          if (item.type === 'folder') {
            const folder = currentZip.folder(name);
            addToZip(item.children, folder);
          } else {
            currentZip.file(name, item.content);
          }
        }
      };
      
      addToZip(fileStructure);
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate ZIP file');
    } finally {
      setIsProcessing(false);
    }
  }, [fileStructure]);

  const renderFileTree = useCallback((structure, level = 0) => {
    return Object.entries(structure).map(([name, item]) => {
      const isExpanded = expandedFolders.has(item.path);
      const indent = level * 20;
      
      if (item.type === 'folder') {
        return (
          <div key={item.path} className="select-none">
            <div
              className="flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded"
              style={{ paddingLeft: `${8 + indent}px` }}
              onClick={() => toggleFolder(item.path)}
            >
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500 mr-2" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-700">{name}</span>
            </div>
            {isExpanded && (
              <div className="ml-2">
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={item.path}
            className="flex items-center py-1 px-2 hover:bg-gray-50 rounded"
            style={{ paddingLeft: `${8 + indent}px` }}
          >
            <File className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">{name}</span>
          </div>
        );
      }
    });
  }, [expandedFolders, toggleFolder]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleJsonInput(e.target.result);
      };
      reader.readAsText(file);
    }
  }, [handleJsonInput]);

  const clearAll = useCallback(() => {
    setJsonInput('');
    setFileStructure(null);
    setError('');
    setExpandedFolders(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              JSON to ZIP Converter
            </h1>
            <p className="text-blue-100 mt-1">Convert JSON data to downloadable ZIP files with file tree preview</p>
          </div>
          
          <div className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">JSON Input</h2>
                  <div className="flex gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload JSON
                      </Button>
                    </label>
                    {jsonInput && (
                      <Button variant="outline" size="sm" onClick={clearAll}>
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                
                <textarea
                  value={jsonInput}
                  onChange={(e) => handleJsonInput(e.target.value)}
                  placeholder="Paste your JSON here or upload a JSON file..."
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                {fileStructure && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={generateZip}
                      disabled={isProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download ZIP
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">File Tree Preview</h2>
                
                <div className="border border-gray-300 rounded-lg h-96 overflow-auto bg-gray-50">
                  {fileStructure ? (
                    <div className="p-2">
                      {renderFileTree(fileStructure)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm">File tree will appear here</p>
                        <p className="text-xs text-gray-400 mt-1">Enter valid JSON to see the structure</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {fileStructure && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Preview:</strong> This shows how your files and folders will be organized in the ZIP file.
                      Click folders to expand/collapse them.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How to use:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">1. Input JSON</h4>
                <p>Paste your JSON data or upload a JSON file</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-2 mt-1">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">2. Preview Structure</h4>
                <p>Review the file tree that will be created</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 rounded-full p-2 mt-1">
                <Download className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">3. Download ZIP</h4>
                <p>Generate and download your ZIP file</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;