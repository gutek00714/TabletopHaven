const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, directory) => {
  const fullDirectory = path.join(__dirname, directory);
  const spawned = spawn(command, args, { cwd: fullDirectory, stdio: 'inherit', shell: true });

  spawned.on('error', (err) => {
    console.error(`Failed to start "${command}" in "${fullDirectory}": ${err}`);
  });

  return spawned;
};

runCommand('npm', ['run', 'serve'], './frontend');
runCommand('npm', ['run', 'watch'], './backend');
