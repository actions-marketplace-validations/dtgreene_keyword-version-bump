import { execSync } from 'child_process';
import * as fs from 'fs';
import {
  getEnv,
  loadJson,
  saveJson,
  exitSuccess,
  exitFailure,
  execute,
} from '../src/utils';
import { getFileBuffer, resetEnv, setEnv } from './test-utils';

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error();
});
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;
const mockExecSync = execSync as jest.Mock;
jest.mock('child_process');
jest.mock('fs');

describe('utils', () => {
  afterEach(() => {
    resetEnv();
  });
  it('loadJson', () => {
    mockReadFileSync.mockReturnValueOnce(getFileBuffer({ version: '1.2.3' }));
    expect(loadJson('some/file/path')).toEqual({ version: '1.2.3' });
  });
  it('loadJson, exits when file cannot be read', () => {
    mockReadFileSync.mockReturnValueOnce(Buffer.from(''));
    expect(() => loadJson('some/file/path')).toThrow();
  });
  it('saveJson', () => {
    expect(() => {
      saveJson('some/file/path', '');
    }).not.toThrow();
  });
  it('saveJson, exits when file cannot be saved', () => {
    mockWriteFileSync.mockImplementationOnce(() => {
      throw new Error();
    });
    expect(() => saveJson('some/file/path', '')).toThrow();
  });
  it('getEnv', () => {
    setEnv({ TESTING_123: 'pizza' });
    expect(getEnv('TESTING_123')).toEqual('pizza');
  });
  it('getEnv, exits when var not found', () => {
    expect(() => getEnv('KRABBY_PATTY_SECRET_FORMULA')).toThrow();
  });
  it('exitSuccess', () => {
    expect(() => {
      exitSuccess('Action success');
    }).toThrow();
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
  });
  it('exitFailure', () => {
    expect(() => {
      exitFailure('Something bad happened');
    }).toThrow();
    expect(mockExit).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
  it('execute', () => {
    setEnv({ GITHUB_WORKSPACE: 'workspace/123' });
    execute('ls');
    expect(mockExecSync.mock.calls[0][0]).toEqual('ls');
  });
});
