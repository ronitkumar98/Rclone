import React, { useState } from 'react';
import Editor from './components/Editor';
import FileManager from './components/FileManager';
import DeployPanel from './components/DeployPanel';
import InteractPanel from './components/InteractPanel';
import './App.css';

function App() {
  const [currentFile, setCurrentFile] = useState(null);
  const [deployedAddress, setDeployedAddress] = useState(null);

  return (
    <div className="app">
      <div className="sidebar">
        <FileManager currentFile={currentFile} setCurrentFile={setCurrentFile} />
      </div>
      <div className="main">
        <Editor currentFile={currentFile} />
        <div className="panels">
          <DeployPanel currentFile={currentFile} setDeployedAddress={setDeployedAddress} />
          {deployedAddress && <InteractPanel address={deployedAddress} />}
        </div>
      </div>
    </div>
  );
}

export default App;