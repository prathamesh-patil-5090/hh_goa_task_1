const { execSync } = require("child_process");

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const stdout = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== "0" && pid !== String(process.pid)) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`✓ Terminated process ${pid} occupying port ${port}`);
        } catch {
          // ignore if process already exited
        }
      }
    } else {
      execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: "ignore" });
      console.log(`✓ Cleared port ${port}`);
    }
  } catch {
    // Port is not in use or findstr returned no match
  }
}

killPort(3000);
