import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'python -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000', cwd: '../backend', url: 'http://127.0.0.1:8000/api/v1/health', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
  ],
})
