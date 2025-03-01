// src/components/Editor.jsx
import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { getPathContent, savePath, getAllFiles } from '../db';

function Editor({ currentFile }) {
  const editorRef = useRef(null);
  const workerRef = useRef(null);
  const [compileStatus, setCompileStatus] = useState('');
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    console.log('Editor component mounted, currentFile:', currentFile);
    try {
      workerRef.current = new Worker('/solcWorker.js');
      console.log('Worker initialized');
    } catch (error) {
      console.error('Failed to initialize worker:', error);
      setCompileStatus('Worker initialization failed');
      return;
    }

    workerRef.current.onmessage = async (event) => {
      console.log('Worker response:', event.data);
      if (event.data.error) {
        console.error('Compilation error:', event.data.error);
        setCompileStatus('Compilation failed: Check console');
      } else {
        console.log('Compiled artifacts:', event.data.artifacts);
        try {
          for (const [path, artifact] of Object.entries(event.data.artifacts)) {
            console.log('Saving artifact:', { path, artifact });
            await savePath(path, JSON.stringify(artifact, null, 2));
            console.log('Artifact saved:', path);
          }
          setCompileStatus('Compilation successful');
        } catch (error) {
          console.error('Failed to save artifacts:', error);
          setCompileStatus('Failed to save artifacts');
        }
      }
    };

    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
      setCompileStatus('Worker failed: Check console');
    };

    if (currentFile) {
      console.log('Fetching initial content for:', currentFile);
      getPathContent(currentFile)
        .then(content => {
          const initialContent = content || '';
          console.log('Initial content loaded:', initialContent);
          setEditorValue(initialContent);
          if (editorRef.current) {
            editorRef.current.setValue(initialContent);
          }
        })
        .catch(err => console.error('Failed to load content:', err));
    }

    return () => {
      console.log('Terminating worker');
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [currentFile]);

  const compileContracts = async () => {
    if (!workerRef.current || !currentFile) {
      console.warn('Compile skipped: No worker or currentFile');
      setCompileStatus('No file selected to compile');
      return;
    }
    setCompileStatus('Compiling... (this may take a moment)');
    const files = await getAllFiles();
    console.log('Sending to worker:', { files, currentFile });
    workerRef.current.postMessage({ files, currentFile });
    // Timeout to update status if compilation takes too long
    setTimeout(() => {
      if (compileStatus === 'Compiling... (this may take a moment)') {
        setCompileStatus('Compilation in progress, please wait...');
      }
    }, 5000);
  };

  const handleEditorChange = async (value) => {
    console.log('Editor onChange:', value);
    setEditorValue(value);
    if (currentFile) {
      console.log('Attempting to save:', { currentFile, content: value });
      try {
        await savePath(currentFile, value);
        console.log('Source code saved:', currentFile);
        const savedContent = await getPathContent(currentFile);
        console.log('Verified saved content:', savedContent);
        await compileContracts();
      } catch (error) {
        console.error('Failed to save source code:', error);
        setCompileStatus('Failed to save source code');
      }
    } else {
      console.warn('No file selected to save or compile');
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log('Editor mounted, instance:', editor);
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div>
      <MonacoEditor
        height="70vh"
        defaultLanguage="solidity"
        value={editorValue || '// Select a file'}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
      />
      <div style={{ padding: '10px' }}>
        <button onClick={compileContracts}>Compile</button>
        <span style={{ marginLeft: '10px' }}>{compileStatus}</span>
      </div>
    </div>
  );
}

export default Editor;