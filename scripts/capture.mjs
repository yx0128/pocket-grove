import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL = process.env.APP_URL ?? 'http://localhost:4173';
const DEBUG_URL = `${URL}${URL.includes('?') ? '&' : '?'}debug=1`;
const PORT = Number(process.env.CDP_PORT ?? 9222);
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs');
const SUFFIX = process.env.SHOT_SUFFIX ?? '';
const [VIEW_WIDTH, VIEW_HEIGHT] = (process.env.VIEWPORT ?? '1440x900')
  .split('x')
  .map(Number);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, attempts = 40) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error(`Preview server not reachable at ${url}`);
}

async function waitForDebugger(attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = await response.json();
      const page = pages.find((entry) => entry.type === 'page');
      if (page) return page;
    } catch {
      await sleep(250);
    }
  }
  throw new Error('Chrome did not expose a debugging target');
}

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      } else if (message.method) {
        this.events.push(message);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text);
    }
    return result.result?.value;
  }

  async screenshot(name) {
    const shot = await this.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const file = `${name}${SUFFIX}.png`;
    fs.writeFileSync(path.join(OUT, file), Buffer.from(shot.data, 'base64'));
    console.log(`saved docs/${file}`);
  }

  async key(key, code, keyCode) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  async clickText(text) {
    return this.evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (node) => node.textContent && node.textContent.trim() === ${JSON.stringify(text)}
      );
      if (!button) return false;
      button.click();
      return true;
    })()`);
  }

  async clickLabel(label) {
    return this.evaluate(`(() => {
      const button = document.querySelector('button[aria-label=${JSON.stringify(label)}]');
      if (!button) return false;
      button.click();
      return true;
    })()`);
  }

  async moveMouse(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
      button: 'none',
    });
  }

  browserErrors() {
    return this.events
      .filter(
        (event) =>
          event.method === 'Runtime.exceptionThrown' ||
          (event.method === 'Log.entryAdded' &&
            event.params.entry.level === 'error') ||
          (event.method === 'Runtime.consoleAPICalled' &&
            event.params.type === 'error'),
      )
      .map((event) => JSON.stringify(event.params));
  }
}

function demoState() {
  const now = Date.now();
  const placed = [
    ['pine', 1, 1, 0],
    ['pine', 6, 1, 2],
    ['pond', 2, 2, 0],
    ['grass', 3, 2, 0],
    ['cherry', 4, 2, 0],
    ['cobblestone', 2, 3, 0],
    ['cobblestone', 3, 3, 0],
    ['cobblestone', 4, 3, 0],
    ['cobblestone', 5, 3, 0],
    ['bench', 3, 4, 0],
    ['cottage', 5, 4, 0],
    ['windmill', 1, 4, 1],
    ['campfire', 2, 5, 0],
    ['grass', 3, 5, 0],
    ['grass', 4, 5, 0],
    ['fountain', 4, 6, 0],
    ['cherry', 6, 6, 0],
    ['pine', 1, 6, 1],
    ['grass', 6, 5, 0],
    ['cobblestone', 4, 4, 0],
    ['grass', 2, 4, 0],
    ['grass', 5, 5, 0],
    ['cobblestone', 4, 7, 0],
    ['cobblestone', 5, 6, 0],
  ].map(([itemId, col, row, rotation], index) => ({
    id: `demo_${index}`,
    itemId,
    col,
    row,
    rotation,
    placedAt: now - 120000,
  }));

  return {
    state: {
      coins: 245,
      tasks: [
        {
          id: 'demo_task_1',
          title: 'Focus for 25 minutes',
          tier: 'deep',
          completed: false,
          createdAt: now - 5000,
        },
        {
          id: 'demo_task_2',
          title: 'Sketch the pond layout',
          tier: 'standard',
          completed: false,
          createdAt: now - 4000,
        },
        {
          id: 'demo_task_3',
          title: 'Take a five-minute stretch',
          tier: 'quick',
          completed: false,
          createdAt: now - 3000,
        },
        {
          id: 'demo_task_4',
          title: 'Clear the desk before starting',
          tier: 'standard',
          completed: true,
          createdAt: now - 2000,
          completedAt: now - 900000,
        },
        {
          id: 'demo_task_5',
          title: 'Drink a glass of water',
          tier: 'quick',
          completed: true,
          createdAt: now - 1000,
          completedAt: now - 800000,
        },
      ],
      inventory: {
        grass: 3,
        cobblestone: 2,
        pond: 1,
        pine: 2,
        cherry: 2,
        bench: 1,
        cottage: 1,
        windmill: 1,
        campfire: 1,
        fountain: 1,
      },
      placed,
      muted: true,
    },
    version: 1,
  };
}

async function main() {
  await waitForServer(URL);
  fs.mkdirSync(OUT, { recursive: true });

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-grove-chrome-'));
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      `--window-size=${VIEW_WIDTH},${VIEW_HEIGHT}`,
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--ignore-gpu-blocklist',
      '--enable-unsafe-swiftshader',
      DEBUG_URL,
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  try {
    const page = await waitForDebugger();
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    cdp = new Cdp(socket);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: VIEW_WIDTH,
      height: VIEW_HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await sleep(1500);
    await cdp.evaluate(
      `localStorage.setItem('pocket-grove-v1', ${JSON.stringify(
        JSON.stringify(demoState()),
      )});`,
    );
    await cdp.send('Page.reload', { ignoreCache: true });
    await sleep(3500);

    const canvasReady = await cdp.evaluate(
      `Boolean(document.querySelector('canvas'))`,
    );
    if (!canvasReady) throw new Error('Canvas did not render');

    await cdp.evaluate(`(() => {
      const style = document.createElement('style');
      style.textContent =
        '*,*::before,*::after{animation-duration:0.001s !important;animation-delay:0s !important;transition-duration:0.001s !important;}';
      document.head.appendChild(style);
    })()`);

    await cdp.key('v', 'KeyV', 86);
    await sleep(900);
    await cdp.screenshot('screenshot-overview');

    await cdp.key('b', 'KeyB', 66);
    await sleep(200);
    await cdp.clickLabel('Select Fountain Plaza, 1 in tray');
    await sleep(300);
    const ghostPoint = await cdp.evaluate(`(() => {
      const debug = window.__pocketGrove;
      if (!debug) return { x: 720, y: 470 };
      const point = new debug.three.Vector3(1.5, 0.1, -1.5).project(debug.camera);
      return {
        x: (point.x * 0.5 + 0.5) * window.innerWidth,
        y: (-point.y * 0.5 + 0.5) * window.innerHeight,
      };
    })()`);
    await cdp.moveMouse(ghostPoint.x, ghostPoint.y);
    await sleep(500);
    await cdp.screenshot('screenshot-build');

    await cdp.clickText('Shop');
    await sleep(700);
    await cdp.screenshot('screenshot-shop');
    await cdp.clickLabel('Close shop');
    await sleep(300);

    await cdp.key('v', 'KeyV', 86);
    await sleep(300);
    await cdp.clickLabel('Hide interface');
    await sleep(900);
    await cdp.screenshot('screenshot-clean');

    await cdp.evaluate(`(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (node) => node.textContent && node.textContent.trim() === 'Show interface'
      );
      if (button) button.style.display = 'none';
    })()`);
    await sleep(300);
    await cdp.screenshot('hero');

    const errors = cdp.browserErrors();
    if (errors.length > 0) {
      console.error(`Browser errors (${errors.length}):`);
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log('No browser console errors.');
    }
  } finally {
    cdp?.socket.close();
    chrome.kill('SIGTERM');
    await sleep(300);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
