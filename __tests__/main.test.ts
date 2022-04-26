import * as fs from 'fs';
import * as core from '@actions/core';
import { run } from '../src/main';
import { getCoreInputMock, getFileBuffer } from './test-utils';

// mock child_process
jest.mock('child_process');

// mock fs
const mockReadFileSync = fs.readFileSync as jest.Mock;
jest.mock('fs');

// mock core
const mockGetInput = core.getInput as jest.Mock;
const mockSetOuput = core.setOutput as jest.Mock;
jest.mock('@actions/core');

// mock utils
const mockExitFailure = jest.fn().mockImplementation(() => {
  throw new Error();
});
const mockExitSuccess = jest.fn();
const mockExecute = jest.fn();
const mockLog = jest.fn();
jest.mock('../src/utils', () => ({
  ...(jest.requireActual('../src/utils') as object),
  exitFailure: (message?: string) => {
    console.log(message);
    mockExitFailure(message);
  },
  exitSuccess: (message?: string) => mockExitSuccess(message),
  execute: (command: string) => mockExecute(command),
  logger: {
    info: (message?: any) => mockLog(message),
    warn: (message?: any) => mockLog(message),
    success: (message?: any) => mockLog(message),
  },
}));

describe('main', () => {
  beforeAll(() => {
    process.env['GITHUB_WORKSPACE'] = '/workspace/';
    process.env['GITHUB_EVENT_PATH'] = '/workspace/event.json';
  });
  afterAll(() => {
    process.env['GITHUB_WORKSPACE'] = undefined;
    process.env['GITHUB_EVENT_PATH'] = undefined;
  });
  it('bumps the version according to the yaml configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'search-target': 'feat: A shiny new feature',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'keywords-minor': 'feat',
      })
    );
    mockExecute.mockReturnValueOnce('"1.2.3"');
    mockExecute.mockReturnValueOnce('v1.3.0');
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ['npm pkg get version'],
        ['npm version --no-git-tag-version minor'],
        ['git commit -am "[skip ci]: Automated version bump 1.3.0"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockExitSuccess).toHaveBeenCalledWith(
        'Bumped version 1.2.3 -> 1.3.0'
      );
      expect(mockLog.mock.calls).toEqual([
        ['Found keyword match: feat; for bump type: minor'],
        ['Using bump type: minor'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(0);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '1.3.0']]);
    }
  });
  it('bumps the version according to the json configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'search-target': 'BREAKING: A huge change',
        configuration: 'some/path/config.json',
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        bump_types: [
          {
            type: 'major',
            keywords: ['BREAKING'],
          },
        ],
        commit_message: '[skip ci]: Automated version bump {version}',
      })
    );
    mockExecute.mockReturnValueOnce('"1.2.3"');
    mockExecute.mockReturnValueOnce('v2.0.0');
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ['npm pkg get version'],
        ['npm version --no-git-tag-version major'],
        ['git commit -am "[skip ci]: Automated version bump 2.0.0"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockExitSuccess).toHaveBeenCalledWith(
        'Bumped version 1.2.3 -> 2.0.0'
      );
      expect(mockLog.mock.calls).toEqual([
        ['Found keyword match: BREAKING; for bump type: major'],
        ['Using bump type: major'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '2.0.0']]);
    }
  });
  it('bumps the version using the default bump type', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'search-target': 'feat: A shiny new feature',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'default-bump-type': 'patch',
      })
    );
    mockExecute.mockReturnValueOnce('"1.2.3"');
    mockExecute.mockReturnValueOnce('v1.2.4');
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ['npm pkg get version'],
        ['npm version --no-git-tag-version patch'],
        ['git commit -am "[skip ci]: Automated version bump 1.2.4"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockExitSuccess).toHaveBeenCalledWith(
        'Bumped version 1.2.3 -> 1.2.4'
      );
      expect(mockLog.mock.calls).toEqual([
        ['No matches found; using default bump type: patch'],
        ['Using bump type: patch'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(0);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '1.2.4']]);
    }
  });
});
