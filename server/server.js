const express = require('express');
const { compileContracts } = require('./compiler');
const { deployContract } = require('./deploy');
const { callContractFunction } = require('./interact');

const app = express();
app.use(express.json());

app.post('/compile', (req, res) => {
  const { files } = req.body; // Expect { "file.sol": "content" }
  compileContracts(files);
  res.json({ message: 'Compilation triggered' });
});

app.post('/deploy', async (req, res) => {
  const { source, contract, accountIndex } = req.body;
  try {
    const address = await deployContract(source, contract, accountIndex);
    res.json({ address });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/call', async (req, res) => {
  const { address, functionName, args, accountIndex, isView } = req.body;
  try {
    const result = await callContractFunction(address, functionName, args, accountIndex, isView);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));