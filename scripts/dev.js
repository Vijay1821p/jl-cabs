import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
["server", "client"].forEach((name) => {
  const child = spawn(npm, ["run", "dev", "-w", name], { stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => process.exit(code ?? 0));
});
