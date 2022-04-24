import * as assert from 'assert';
import * as jsonfile from 'jsonfile';
import { execSync } from 'child_process';

const workingDirectory = process.env['GITHUB_WORKSPACE'];

// https://github.com/Automattic/util-inspect/blob/master/index.js
export const log = {
  default: (message: string) => console.log(message),
  info: (message: string) => logWithStyle(message, [34, 39]), // blue
  warn: (message: string) => logWithStyle(message, [33, 39]), // yellow
  error: (message: string) => logWithStyle(message, [31, 39]), // red
  success: (message: string) => logWithStyle(message, [32, 39]), // green
};

export function getJson(filePath: string) {
  try {
    return jsonfile.readFileSync(filePath);
  } catch (e) {
    exitFailure(
      `Could not load json file at path given: ${filePath}; with error: ${e}`
    );
  }
}

export function getInputList(key: string) {
  return getInputVar(key).split(',');
}

export function getInputVar(key: string) {
  return getVar(`INPUT_${key.toUpperCase()}`);
}

export function getGithubVar(key: string) {
  return getVar(`GITHUB_${key.toUpperCase()}`);
}

function getVar(key: string) {
  try {
    const value = process.env[key];
    assert.ok(value !== undefined, `Value is undefined for key: ${key}`);
    return value;
  } catch (e) {
    exitFailure(`Could not get variable; with error ${e}`);
  }
}

export function exitSuccess(message?: string): never {
  if (message) {
    log.success(message);
  }
  log.success('✔ success - exiting');
  return process.exit(0);
}

export function exitFailure(message?: string): never {
  if (message) {
    log.error(message);
  }
  log.error('✖ failure - exiting');
  return process.exit(1);
}

export function execute(command: string) {
  log.info(command);
  try {
    // setting stdio to pipe will prevent default logging of stdout
    return execSync(command, { cwd: workingDirectory, stdio: 'pipe' });
  } catch (e) {
    exitFailure(`Execute failed with error: ${e}`);
  }
}

function logWithStyle(message: string, style: number[]) {
  if (style) {
    console.log(`\u001b[${style[0]}m${message}\u001b[${style[1]}m`);
  } else {
    console.log(message);
  }
}
