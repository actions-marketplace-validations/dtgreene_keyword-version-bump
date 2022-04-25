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
  exitFailure: (message?: string) => mockExitFailure(message),
  exitSuccess: () => mockExitSuccess(),
  execute: (command: string) => mockExecute(command),
  logger: {
    info: (message?: any) => mockLog(message),
    warn: (message?: any) => mockLog(message),
    success: (message?: any) => mockLog(message),
  },
}));

const packageBuffer = getFileBuffer({ version: '1.2.3' });

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
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'keywords-minor': 'feat',
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        pull_request: {
          title: 'feat: A cool feature',
          labels: [],
        },
      })
    );
    mockReadFileSync.mockReturnValueOnce(packageBuffer);
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ["git config --local user.name 'Rob Schneider'"],
        ["git config --local user.email 'rschneider@github.com'"],
        ['git add ./package.json'],
        ['git commit -m "[skip ci]: Automated version bump 1.3.0"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockLog.mock.calls).toEqual([
        ['Found keyword match: feat; for bump type: minor'],
        ['Using bump type: minor'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '1.3.0']]);
    }
  });
  it('bumps the version according to the json configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
        configuration: 'some/path/config.json',
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        bump_types: [
          {
            type: 'major',
            keywords: [],
            labels: ['breaking'],
          },
        ],
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        pull_request: {
          title: 'My pull request',
          labels: ['breaking'],
        },
      })
    );
    mockReadFileSync.mockReturnValueOnce(packageBuffer);
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ["git config --local user.name 'Rob Schneider'"],
        ["git config --local user.email 'rschneider@github.com'"],
        ['git add ./package.json'],
        ['git commit -m "[skip ci]: Automated version bump 2.0.0"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockLog.mock.calls).toEqual([
        ['Found label match: breaking; for bump type: major'],
        ['Using bump type: major'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '2.0.0']]);
    }
  });
  it('bumps the version using the default bump type', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'default-bump-type': 'patch',
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        pull_request: {
          title: 'My pull request',
          labels: [],
        },
      })
    );
    mockReadFileSync.mockReturnValueOnce(packageBuffer);
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ["git config --local user.name 'Rob Schneider'"],
        ["git config --local user.email 'rschneider@github.com'"],
        ['git add ./package.json'],
        ['git commit -m "[skip ci]: Automated version bump 1.2.4"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockLog.mock.calls).toEqual([
        ['No matches found; using default bump type: patch'],
        ['Using bump type: patch'],
      ]);
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
      expect(mockSetOuput.mock.calls).toEqual([['bumped_version', '1.2.4']]);
    }
  });
  it('exits when the there is no associated pull request', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'default-bump-type': 'patch',
      })
    );
    mockReadFileSync.mockReturnValueOnce(getFileBuffer({ pull_request: null }));
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ["git config --local user.name 'Rob Schneider'"],
        ["git config --local user.email 'rschneider@github.com'"],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(1);
      expect(mockExitFailure).toHaveBeenCalledWith(
        'Action failed; with error: AssertionError [ERR_ASSERTION]: This event has no associated pull request'
      );
      expect(mockExitSuccess).toHaveBeenCalledTimes(0);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    }
  });
});
