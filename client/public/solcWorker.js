// public/solcWorker.js
console.log('solcWorker.js starting');

try {
  importScripts('/soljson.js');
  console.log('soljson.js imported successfully');
} catch (error) {
  console.error('Failed to import soljson.js:', error);
  self.postMessage({ error: 'Failed to load soljson.js: ' + error.message });
}

// Capture any WebAssembly errors
self.Module = self.Module || {};
self.Module.printErr = function(msg) {
  console.error('Solc WASM error:', msg);
};

// Wait for Module initialization with retries and extended timeout
const solcReady = new Promise((resolve, reject) => {
  console.log('Setting up Module initialization');

  self.Module.onRuntimeInitialized = function() {
    console.log('Solc Module initialized successfully');
    resolve(self.Module);
  };

  // Check readiness periodically
  const checkReady = () => {
    if (self.Module._compile) {
      console.log('Solc Module is ready');
      resolve(self.Module);
    } else {
      console.log('Solc Module not ready yet, waiting...');
      setTimeout(checkReady, 5000); // Check every 5 seconds
    }
  };

  setTimeout(checkReady, 1000); // Start checking after 1 second

  // Timeout after 30 seconds total
  setTimeout(() => {
    if (!self.Module._compile) {
      console.error('Solc initialization failed after 30 seconds');
      reject(new Error('Solc initialization failed after 30 seconds'));
    }
  }, 30000);
});

// Manually create a solc wrapper
const solc = {
  compile: function(input, options) {
    if (!self.Module._compile) {
      throw new Error('Solc Module not initialized');
    }
    const inputPtr = self.Module._malloc(input.length + 1);
    const optionsPtr = self.Module._malloc(JSON.stringify(options).length + 1);
    self.Module.writeAsciiToMemory(input, inputPtr);
    self.Module.writeAsciiToMemory(JSON.stringify(options), optionsPtr);
    const outputPtr = self.Module._compile(inputPtr, optionsPtr);
    const output = self.Module.UTF8ToString(outputPtr);
    self.Module._free(inputPtr);
    self.Module._free(optionsPtr);
    self.Module._free(outputPtr);
    return output;
  }
};

self.onmessage = async function(event) {
  try {
    console.log('Waiting for solc initialization...');
    const module = await solcReady;
    console.log('Solc ready, processing message with Module:', module);

    const { files, currentFile } = event.data;

    const input = {
      language: 'Solidity',
      sources: files,
      settings: {
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } }
      }
    };

    function findImports(path) {
      console.log('Resolving import:', path, 'from:', currentFile);
      let normalizedPath = path;
      if (path.startsWith('./') || path.startsWith('../')) {
        normalizedPath = resolvePath(path, currentFile);
      } else if (path.startsWith('/')) {
        normalizedPath = path.substring(1);
      }
      console.log('Normalized import path:', normalizedPath);
      if (files[normalizedPath]) {
        return { contents: files[normalizedPath].content };
      }
      return { error: `File not found: ${normalizedPath}` };
    }

    function resolvePath(importPath, basePath) {
      const baseDir = basePath.split('/').slice(0, -1).join('/') || '';
      const parts = importPath.split('/');
      let current = baseDir.split('/').filter(Boolean);

      for (const part of parts) {
        if (part === '..') {
          current.pop();
        } else if (part !== '.' && part !== '') {
          current.push(part);
        }
      }
      const resolved = current.join('/');
      console.log('Resolved path:', resolved);
      return resolved;
    }

    console.log('Compiling with input:', input);
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    console.log('Compilation output:', output);
    if (output.errors && output.errors.some(err => err.severity === 'error')) {
      self.postMessage({ error: output.errors });
      return;
    }

    const artifacts = {};
    for (const file in output.contracts) {
      for (const contractName in output.contracts[file]) {
        const artifactPath = `artifacts/${file.replace(/\.sol$/, '')}_${contractName}.json`;
        artifacts[artifactPath] = {
          contractName,
          abi: output.contracts[file][contractName].abi,
          bytecode: output.contracts[file][contractName].evm.bytecode.object
        };
      }
    }
    self.postMessage({ artifacts });
  } catch (error) {
    console.error('Compilation failed:', error);
    self.postMessage({ error: error.message });
  }
};

self.onerror = function(error) {
  console.error('Worker error:', error);
  self.postMessage({ error: error.message });
};