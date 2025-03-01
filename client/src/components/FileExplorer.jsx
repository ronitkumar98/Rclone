import React, { useState, useEffect } from 'react';
import { getFiles, saveFile } from '../db';

function FileExplorer({ setCurrentFile }) {
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');

  useEffect(() => {
    getFiles().then(setFiles);
  }, []);

  const createFile = async () => {
    if (newFileName) {
      const fileName = `${newFileName}.sol`;
      await saveFile(fileName, '');
      setFiles([...files, fileName]);
      setNewFileName('');
    }
  };

  return (
    <div>
      <h3>Files</h3>
      <input
        value={newFileName}
        onChange={e => setNewFileName(e.target.value)}
        placeholder="New file name"
      />
      <button onClick={createFile}>Create</button>
      <ul>
        {files.map(file => (
          <li key={file} onClick={() => setCurrentFile(file)}>{file}</li>
        ))}
      </ul>
    </div>
  );
}

export default FileExplorer;