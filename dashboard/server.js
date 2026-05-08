import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Store active processes
const activeRuns = new Map();

app.post('/api/run', (req, res) => {
  const { disease } = req.body;
  if (!disease) {
    return res.status(400).json({ error: 'Disease is required' });
  }

  // To prevent multiple concurrent runs for the same disease
  if (activeRuns.has(disease)) {
    return res.status(400).json({ error: 'Already running' });
  }

  console.log(`Starting benchmark for ${disease}...`);

  // Spawn the python process
  const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
  const args = ['main.py', '-d', disease];
  const cwd = path.resolve(__dirname, '..'); // Run from major project root

  const child = spawn(pythonExecutable, args, { cwd });
  
  // We don't wait for it to finish to respond. We'll use SSE for logs.
  activeRuns.set(disease, child);

  // When finished, clean up
  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    activeRuns.delete(disease);
  });

  res.json({ message: 'Started', runId: disease });
});

// Server-Sent Events endpoint to stream logs
app.get('/api/logs/:disease', (req, res) => {
  const { disease } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const child = activeRuns.get(disease);
  
  if (!child) {
    // Maybe it finished immediately or never started
    res.write(`data: ${JSON.stringify({ log: 'Process completed or not found.\n', done: true })}\n\n`);
    res.end();
    return;
  }

  const onData = (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
         res.write(`data: ${JSON.stringify({ log: line, done: false })}\n\n`);
      }
    });
  };

  const onError = (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
         res.write(`data: ${JSON.stringify({ log: `ERROR: ${line}`, done: false })}\n\n`);
      }
    });
  };

  const onClose = () => {
    res.write(`data: ${JSON.stringify({ log: 'PROCESS FINISHED.\n', done: true })}\n\n`);
    res.end();
  };

  child.stdout.on('data', onData);
  child.stderr.on('data', onError);
  child.on('close', onClose);

  req.on('close', () => {
    child.stdout.removeListener('data', onData);
    child.stderr.removeListener('data', onError);
    child.removeListener('close', onClose);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
