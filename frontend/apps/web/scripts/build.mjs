// Resilient wrapper around `next build`.
//
// Why this exists:
//   On Windows the production build intermittently fails while the
//   PagesManifestPlugin writes `.next/server/pages-manifest.json`:
//
//     HookWebpackError: UNKNOWN: unknown error, open '...\server\pages-manifest.json'
//
//   This is NOT a code/type/config problem (`next build` succeeds on a retry with
//   no source changes; `tsc --noEmit` is clean). It is a transient on-access file
//   lock taken by real-time antivirus/indexers (McAfee is installed on this
//   machine) on the freshly created manifest file. libuv surfaces the Windows
//   sharing violation as `UNKNOWN: unknown error`. The proper fix is an AV
//   exclusion for this project directory and/or node.exe (or moving the repo out
//   of the `Downloads` folder); this script is a safe in-repo mitigation so a
//   normal `npm run build` completes reliably.
//
// Behaviour:
//   - Runs the real `next build` (full type-check, prerender and tracing are kept).
//   - Only retries when the failure matches a known TRANSIENT filesystem signature.
//   - Any other failure exits immediately with the original code, so genuine
//     build errors are never masked.
//   - Cleans `.next` and backs off between attempts to let the lock release.
//   - Override attempts with NEXT_BUILD_RETRIES (default 3).

import { spawn } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(path.dirname(require.resolve('next/package.json')), 'dist', 'bin', 'next');

const MAX_ATTEMPTS = Math.max(1, Number(process.env.NEXT_BUILD_RETRIES) || 5);

// Real-time AV (McAfee mc-neo-host) holds a memory-mapped scan handle on the
// freshly written file, so Windows rejects the next write/truncate with
// ERROR_USER_MAPPING_NOT_MEM_MAP (os error 1224), which libuv surfaces as a
// generic "UNKNOWN: unknown error". These patterns describe that transient lock;
// a genuine compile/type/prerender error will NOT match and exits immediately.
const TRANSIENT =
  /UNKNOWN: unknown error|os error 1224|user-mapped section open|ERROR_USER_MAPPING_NOT_MEM_MAP|The requested operation cannot be performed on a file with a user-mapped section|EBUSY|ENOTEMPTY|resource temporarily unavailable|too many open files|Device or resource busy|PageNotFoundError|Cannot find module for page/i;

function runOnce() {
  return new Promise((resolve) => {
    let captured = '';
    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd: projectDir,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1' },
      shell: false,
    });

    const tee = (chunk) => {
      const text = chunk.toString();
      captured += text;
      // Keep the captured buffer bounded; we only need it for signature matching.
      if (captured.length > 200000) captured = captured.slice(-120000);
      process.stdout.write(text);
    };
    child.stdout.on('data', tee);
    child.stderr.on('data', tee);
    child.on('error', (err) => resolve({ code: 1, captured: `${captured}\n${err.message}` }));
    child.on('close', (code) => resolve({ code: code ?? 1, captured }));
  });
}

function cleanDistDir() {
  // Removing .next can itself hit the transient AV lock; retry a few times so we
  // always start the next attempt from a clean output directory.
  const dir = path.join(projectDir, '.next');
  for (let i = 0; i < 5; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* ignore, retry */
    }
    if (!existsSync(dir)) return;
    const until = Date.now() + 1200;
    while (Date.now() < until) {
      /* brief synchronous settle so AV releases its mapped handles */
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let last = { code: 1, captured: '' };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      process.stdout.write(
        `\n> Retrying next build (attempt ${attempt}/${MAX_ATTEMPTS}) after a transient filesystem lock ...\n\n`,
      );
    }
    last = await runOnce();

    if (last.code === 0) process.exit(0);

    const transient = TRANSIENT.test(last.captured);
    if (!transient) {
      // Real build error (type/compile/config): surface it immediately, no masking.
      process.exit(last.code || 1);
    }

    if (attempt < MAX_ATTEMPTS) {
      cleanDistDir();
      // Wait long enough for the AV scan queue to drain before re-attempting.
      await sleep(3000 + 6000 * attempt);
    }
  }

  process.stderr.write(
    `\n> next build kept hitting a transient filesystem lock after ${MAX_ATTEMPTS} attempts.\n` +
      `> Root cause is real-time antivirus/indexer locking .next files on Windows.\n` +
      `> Permanent fix: add an antivirus exclusion for "${projectDir}" and/or node.exe,\n` +
      `> or move this repo out of the Downloads folder.\n`,
  );
  process.exit(last.code || 1);
})();
