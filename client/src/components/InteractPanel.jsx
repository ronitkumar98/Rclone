import React, { useState } from 'react';
import axios from 'axios';

function InteractPanel({ address }) {
  const [functionName, setFunctionName] = useState('');
  const [args, setArgs] = useState('');
  const [accountIndex, setAccountIndex] = useState(0);
  const [output, setOutput] = useState('');

  const callFunction = () => {
    const isView = confirm('Is this a view function?');
    axios.post('http://localhost:3001/call', {
      address,
      functionName,
      args: args.split(',').map(arg => arg.trim()),
      accountIndex,
      isView
    }).then(res => setOutput(JSON.stringify(res.data)));
  };

  return (
    <div>
      <h3>Interact</h3>
      <select onChange={e => setAccountIndex(e.target.value)}>
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={i}>Account {i}</option>
        ))}
      </select>
      <input
        placeholder="Function Name"
        value={functionName}
        onChange={e => setFunctionName(e.target.value)}
      />
      <input
        placeholder="Args (comma-separated)"
        value={args}
        onChange={e => setArgs(e.target.value)}
      />
      <button onClick={callFunction}>Call</button>
      <div>{output}</div>
    </div>
  );
}

export default InteractPanel;