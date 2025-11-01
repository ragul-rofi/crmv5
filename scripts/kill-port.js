import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const killPort = async (port = 5000) => {
  try {
    console.log(`🔍 Checking for processes on port ${port}...`);
    
    const { stdout } = await execAsync(`powershell "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object OwningProcess"`);
    
    const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('OwningProcess') && !line.includes('---'));
    
    if (lines.length === 0) {
      console.log(`✅ Port ${port} is free`);
      return;
    }
    
    for (const line of lines) {
      const pid = line.trim();
      if (pid && !isNaN(pid)) {
        console.log(`🔪 Killing process ${pid} on port ${port}...`);
        await execAsync(`taskkill /PID ${pid} /F`);
        console.log(`✅ Process ${pid} terminated`);
      }
    }
  } catch (error) {
    console.log(`ℹ️ No processes found on port ${port} or already free`);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.argv[2] || 5000;
  killPort(port);
}

export default killPort;