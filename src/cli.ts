#!/usr/bin/env node
import path from 'node:path';
import { loadConfig } from './config.js';
import { validateLicense } from './license.js';
import { build } from './render.js';

interface Args {
  command?: string;
  config?: string;
  out?: string;
  verbose: boolean;
  help: boolean;
  licenseKey?: string;
  licenseMode: 'fake' | 'live';
  licenseEndpoint?: string;
}

function usage(): string {
  return `storeshots — turn raw app screenshots into store-ready sets (offline, deterministic)

Usage:
  storeshots build --config <file.yaml> [--out <dir>] [--verbose]
                   [--license-key K] [--license-mode fake|live] [--license-endpoint URL]

Options:
  --config          Path to YAML build config (required)
  --out             Override output directory from the config
  --verbose         Log every rendered file
  --license-key     Validate a license key before building (optional in v1)
  --license-mode    fake = deterministic local self-check (tests/CI only);
                    live = real endpoint (NOT wired in v1 — see README handoff)
  --license-endpoint License server base URL (live mode only)
  --help            Show this help
`;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { verbose: false, help: false, licenseMode: 'live' };
  const rest = [...argv];
  args.command = rest.shift();
  while (rest.length > 0) {
    const a = rest.shift()!;
    switch (a) {
      case '--config':
        args.config = rest.shift();
        break;
      case '--out':
        args.out = rest.shift();
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--license-key':
        args.licenseKey = rest.shift();
        break;
      case '--license-mode':
        args.licenseMode = rest.shift() as 'fake' | 'live';
        break;
      case '--license-endpoint':
        args.licenseEndpoint = rest.shift();
        break;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (args.licenseMode !== 'fake' && args.licenseMode !== 'live') throw new Error('--license-mode must be fake or live');
  return args;
}

async function main(): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error((e as Error).message);
    console.error(usage());
    return 1;
  }
  if (args.help || !args.command) {
    console.log(usage());
    return args.command ? 0 : 1;
  }
  if (args.command !== 'build') {
    console.error(`Unknown command: ${args.command}`);
    console.error(usage());
    return 1;
  }
  if (!args.config) {
    console.error('Missing required --config <file.yaml>');
    return 1;
  }

  try {
    if (args.licenseKey) {
      const res = await validateLicense(args.licenseKey, {
        mode: args.licenseMode,
        endpoint: args.licenseEndpoint,
      });
      if (!res.valid) {
        console.error(`License check failed: ${res.detail}`);
        return 2;
      }
      if (args.verbose) console.log(`License check: ${res.detail}`);
    }

    const config = loadConfig(args.config);
    if (args.out) config.out = path.resolve(args.out);

    const result = await build(config);
    for (const w of result.warnings) console.error(`warning: ${w}`);
    if (args.verbose) for (const f of result.written) console.log(`wrote ${path.join(result.out, f)}`);
    console.log(`Built ${result.total} screenshot(s) -> ${result.out}`);
    if (result.warnings.length > 0) console.log(`(${result.warnings.length} warning(s) — see above)`);
    return 0;
  } catch (e) {
    console.error(`error: ${(e as Error).message}`);
    return 1;
  }
}

main().then((code) => process.exit(code));
