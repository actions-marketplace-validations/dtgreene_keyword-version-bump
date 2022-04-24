import * as c from 'ansi-colors';
import * as core from '@actions/core';
import * as assert from 'assert';
import * as fs from 'fs';
import { execSync } from 'child_process';

const workingDirectory = process.env['GITHUB_WORKSPACE'];

export const logger = {
  info: (message: string) => core.info(c.cyan(message)),
  warn: (message: string) => core.info(c.yellow(message)),
  error: (message: string) => core.info(c.red(message)),
  success: (message: string) => core.info(c.green(message)),
};

export function loadJson(filePath: string) {
  try {
    const contents = fs.readFileSync(filePath);
    return JSON.parse(contents.toString());
  } catch (e) {
    exitFailure(`Load json failed for: ${filePath}; with error: ${e}`);
  }
}

export function saveJson(filePath: string, data: any) {
  try {
    // save the json file with two-space tabs
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    exitFailure(`Save json failed for: ${filePath}; with error: ${e}`);
  }
}

export function getEnv(key: string) {
  try {
    const value = process.env[key];
    assert.ok(value !== undefined, `Value is undefined for key: ${key}`);
    return value;
  } catch (e) {
    exitFailure(`Could not get variable; with error ${e}`);
  }
}

export function exitSuccess(message: string): never {
  logger.success(message);
  return process.exit(0);
}

export function exitFailure(message: string): never {
  logger.error(message);
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
