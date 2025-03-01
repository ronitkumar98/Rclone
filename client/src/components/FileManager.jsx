// src/components/FileManager.jsx
import React, { useState, useEffect } from 'react';
import { getAllPaths, savePath, deletePath, pathExists, getFolderChildren } from '../db';

function FileManager({ currentFile, setCurrentFile }) {
  const [paths, setPaths] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [currentFolder, setCurrentFolder] = useState('');

  useEffect(() => {
    updatePaths();
  }, []);

  const updatePaths = async () => {
    const allPaths = await getAllPaths();
    setPaths(allPaths.sort());
  };

  const createItem = async (isFolder) => {
    if (newItemName) {
      const basePath = currentFolder || ''; // Default to root without slashes
      let path = `${basePath}${newItemName}`;
      if (isFolder) {
        path = path.endsWith('/') ? path : `${path}/`;
      } else {
        path = path.endsWith('.sol') ? path : `${path}.sol`;
      }
      if (!(await pathExists(path))) {
        await savePath(path, isFolder ? null : '');
        setPaths([...paths, path].sort());
        if (!isFolder) {
          console.log('Setting currentFile:', path);
          setCurrentFile(path);
        }
      }
      setNewItemName('');
    }
  };

  const deleteItem = async (path) => {
    const children = await getFolderChildren(path);
    if (children.length > 1) {
      if (!confirm(`Delete folder "${path}" and all its contents?`)) return;
      await Promise.all(children.map(child => deletePath(child)));
    } else {
      await deletePath(path);
    }
    setPaths(paths.filter(p => p !== path && !p.startsWith(path)));
    if (currentFile === path) setCurrentFile(null);
  };

  const buildTree = () => {
    const tree = { '': { children: {}, isFolder: true } }; // Root as empty string
    paths.forEach(path => {
      const parts = path.split('/').filter(Boolean);
      let current = tree[''].children;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = { children: {}, isFolder: index < parts.length - 1 || path.endsWith('/') };
        }
        current = current[part].children;
      });
    });
    return tree;
  };

  const renderTree = (node, prefix = '') => {
    return Object.entries(node).map(([name, { children, isFolder }]) => {
      const fullPath = `${prefix}${name}${isFolder ? '/' : ''}`;
      return (
        <li key={fullPath}>
          <span
            onClick={() => {
              if (isFolder) setCurrentFolder(fullPath);
              else {
                console.log('Setting currentFile:', fullPath);
                setCurrentFile(fullPath);
              }
            }}
            style={{
              cursor: 'pointer',
              color: isFolder ? (fullPath === currentFolder ? '#ff4500' : '#666') : fullPath.startsWith('artifacts/') ? '#888' : '#007bff',
              fontWeight: fullPath === currentFolder ? 'bold' : 'normal'
            }}
          >
            {name}
          </span>
          {!fullPath.startsWith('artifacts/') && (
            <button onClick={() => deleteItem(fullPath)} style={{ marginLeft: '5px', color: 'red' }}>X</button>
          )}
          {Object.keys(children).length > 0 && (
            <ul>{renderTree(children, fullPath)}</ul>
          )}
        </li>
      );
    });
  };

  const tree = buildTree();

  return (
    <div>
      <h3>File Manager (Current: {currentFolder || '/'})</h3>
      <input
        value={newItemName}
        onChange={e => setNewItemName(e.target.value)}
        placeholder={`New item in ${currentFolder || '/'}`}
      />
      <button onClick={() => createItem(false)}>Create File</button>
      <button onClick={() => createItem(true)}>Create Folder</button>
      <ul>{renderTree(tree)}</ul>
    </div>
  );
}

export default FileManager;