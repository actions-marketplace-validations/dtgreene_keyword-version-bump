import * as c from 'ansi-colors';
import * as assert from 'assert';
import * as jsonfile from 'jsonfile';
import { execSync } from 'child_process';

const workingDirectory = process.env['GITHUB_WORKSPACE'];

export const logger = {
  info: (message: string) => console.log(c.cyan(message)),
  warn: (message: string) => console.log(c.yellow(message)),
  error: (message: string) => console.log(c.red(message)),
  success: (message: string) => console.log(c.bgGreen(message)),
  special: (message: string) => console.log(c.magenta(message)),
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
    logger.success(message);
  }
  logger.success('✔ success - exiting');
  return process.exit(0);
}

export function exitFailure(message?: string): never {
  if (message) {
    logger.error(message);
  }
  logger.error('✖ failure - exiting');
  return process.exit(1);
}

export function execute(command: string) {
  logger.info(command);
  try {
    // setting stdio to pipe will prevent default logging of stdout
    return execSync(command, { cwd: workingDirectory, stdio: 'pipe' });
  } catch (e) {
    exitFailure(`Execute failed with error: ${e}`);
  }
}

function logWithColor(message?: string, color?: number[]) {
  if (color) {
    console.log(`\u001b[${color[0]}m${message}\u001b[${color[1]}m`);
  } else {
    console.log(message);
  }
}
