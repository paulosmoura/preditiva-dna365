import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 3200;
const HOST = "127.0.0.1";

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PREDITIVA_PORT inválida: ${value}`);
  }
  return port;
}

function verifyPortIsAvailable(port) {
  return new Promise((resolveCheck, rejectCheck) => {
    const server = createServer();
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        rejectCheck(new Error(`A porta ${port} já está ocupada. Defina outra em PREDITIVA_PORT.`));
        return;
      }
      rejectCheck(error);
    });
    server.once("listening", () => server.close((error) => (error ? rejectCheck(error) : resolveCheck())));
    server.listen(port);
  });
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "dev" && mode !== "start") throw new Error("Modo inválido. Use dev ou start.");
  const port = parsePort(process.env.PREDITIVA_PORT ?? DEFAULT_PORT);
  await verifyPortIsAvailable(port);
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const nextCli = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextCli, mode, "--hostname", HOST, "--port", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: "inherit",
  });
  child.once("exit", (code) => { process.exitCode = code ?? 1; });
}

main().catch((error) => {
  console.error(`[Preditiva] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
