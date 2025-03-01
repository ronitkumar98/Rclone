const solc = require('solc');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function compileContracts(sources) {
  const artifactsDir = path.join(__dirname, '../artifacts');

  if (!Object.keys(sources).length) {
    console.log(chalk.yellow('No contracts to compile'));
    return;
  }

  const input = {
    language: 'Solidity',
    sources: Object.fromEntries(
      Object.entries(sources).map(([name, content]) => [name, { content }])
    ),
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };

  console.log('Compiling contracts...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    output.errors.forEach(err => {
      console.log(err.severity === 'error' ? chalk.red(err.formattedMessage) : chalk.yellow(err.formattedMessage));
    });
    if (output.errors.some(err => err.severity === 'error')) return;
  }

  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
  for (const sourceFile in output.contracts) {
    const artifactPath = path.join(artifactsDir, `${sourceFile}.json`);
    const artifactDir = path.dirname(artifactPath);
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(artifactPath, JSON.stringify(output.contracts[sourceFile], null, 2));
  }
  console.log(chalk.green('Compilation successful'));
}

module.exports = { compileContracts };