const net = require('net');
const { spawn } = require('child_process');

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });
}

async function findAvailablePort(startPort = 3001) {
  let port = startPort;
  while (!(await checkPort(port))) {
    port++;
  }
  return port;
}

async function main() {
  const preferredPort = parseInt(process.env.PORT || '3001', 10);
  // Default base port is 3001 to keep 3000 available for NestJS backend
  const basePort = preferredPort === 3000 ? 3001 : preferredPort;
  const port = await findAvailablePort(basePort);

  if (port !== preferredPort) {
    console.log(`\x1b[33m[dev]\x1b[0m Port ${preferredPort} is in use. Auto-selected available port \x1b[32m${port}\x1b[0m.`);
  }

  const extraArgs = process.argv.slice(2);
  const child = spawn('npx', ['next', 'dev', '-p', String(port), ...extraArgs], {
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((sig) => {
    process.on(sig, () => {
      if (child.pid) {
        try {
          process.kill(child.pid, sig);
        } catch {}
      }
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
