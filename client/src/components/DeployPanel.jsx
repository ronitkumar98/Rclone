import React, { useState } from 'react';
import axios from 'axios';

function DeployPanel({ currentFile, setDeployedAddress }) {
  const [accountIndex, setAccountIndex] = useState(0);
  const [contractName, setContractName] = useState('');

  const deploy = () => {
    if (currentFile && contractName) {
      axios.post('http://localhost:3001/deploy', { source: currentFile, contract: contractName, accountIndex })
        .then(res => setDeployedAddress(res.data.address));
    }
  };

  return (
    <div>
      <h3>Deploy</h3>
      <select onChange={e => setAccountIndex(e.target.value)}>
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={i}>Account {i}</option>
        ))}
      </select>
      <input
        placeholder="Contract Name"
        value={contractName}
        onChange={e => setContractName(e.target.value)}
      />
      <button onClick={deploy}>Deploy</button>
    </div>
  );
}

export default DeployPanel;