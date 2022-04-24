import { execSync } from 'child_process';
import * as fs from 'fs';
import {
  execute,
  exitFailure,
  exitSuccess,
  getInputVar,
  getInputList,
  getJson,
  getGithubVar,
} from '../src/utils';
import { resetActionVars, setActionVars, getFileBuffer } from './test-utils';

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error();
});
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExecSync = execSync as jest.Mock;
jest.mock('child_process');
jest.mock('fs');

describe('utils', () => {
  afterEach(() => {
    resetActionVars();
  });
  it('getJson', () => {
    mockReadFileSync.mockReturnValueOnce(getFileBuffer({ version: '1.2.3' }));
    expect(getJson('some/file/path')).toEqual({ version: '1.2.3' });
  });
  it('getJson, exits when file cannot be read', () => {
    mockReadFileSync.mockReturnValueOnce(Buffer.from(''));
    expect(() => getJson('some/file/path')).toThrow();
  });
  it('getInputList', () => {
    setActionVars({ 'INPUT_TEST-KEY': 'apples,oranges,grapes' });
    expect(getInputList('test-key')).toEqual(['apples', 'oranges', 'grapes']);
  });
  it('getInputVar', () => {
    setActionVars({ 'INPUT_TEST-KEY': 'pizza' });
    expect(getInputVar('test-key')).toEqual('pizza');
  });
  it('getInputVar, exits when var not found', () => {
    expect(() => getInputVar('krabby-patty-secret-formula')).toThrow();
  });
  it('getGithubVar', () => {
    setActionVars({ 'GITHUB_TEST-KEY': 'Bump and Tag' });
    expect(getGithubVar('test-key')).toEqual('Bump and Tag');
  });
  it('getGithubVar, exits when var not found', () => {
    expect(() => getGithubVar('krabby-patty-secret-formula')).toThrow();
  });
  it('exitSuccess', () => {
    expect(() => {
      exitSuccess();
    }).toThrow();
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  it('exitFailure', () => {
    expect(() => {
      exitFailure();
    }).toThrow();
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  it('execute', () => {
    setActionVars({ GITHUB_WORKSPACE: 'workspace/123' });
    execute('ls');
    expect(mockExecSync.mock.calls[0][0]).toEqual('ls');
  });
});
