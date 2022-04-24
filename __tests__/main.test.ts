import * as fs from 'fs';
import { run } from '../src/main';
import { getFileBuffer, setActionVars, resetActionVars } from './test-utils';

const mockReadFileSync = fs.readFileSync as jest.Mock;
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
    success: (message?: any) => mockLog(message),
  },
}));
jest.mock('child_process');
jest.mock('fs');

const packageBuffer = getFileBuffer({ version: '1.2.3' });

describe('main', () => {
  afterEach(() => {
    resetActionVars();
  });
  it('bumps the version according to the yaml configuration', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      'INPUT_KEYWORDS-MINOR': 'feat',
      GITHUB_EVENT_PATH: '/workspace/event.json',
    });
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
      expect(mockLog).toHaveBeenCalledWith('Matched keyword: feat in title: feat: A cool feature');
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    }
  });
  it('bumps the version according to the json configuration', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Michael Collins',
      'INPUT_AUTHOR-EMAIL': 'mcollins@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      INPUT_CONFIGURATION: 'some/path/config.json',
      GITHUB_EVENT_PATH: '/workspace/event.json',
    });
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
        ["git config --local user.name 'Michael Collins'"],
        ["git config --local user.email 'mcollins@github.com'"],
        ['git add ./package.json'],
        ['git commit -m "[skip ci]: Automated version bump 2.0.0"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith('Matched label: breaking');
      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
    }
  });
  it('bumps the version using the default bump type', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Michael Collins',
      'INPUT_AUTHOR-EMAIL': 'mcollins@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      'INPUT_DEFAULT-BUMP-TYPE': 'patch',
      GITHUB_EVENT_PATH: '/workspace/event.json',
    });
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
        ["git config --local user.name 'Michael Collins'"],
        ["git config --local user.email 'mcollins@github.com'"],
        ['git add ./package.json'],
        ['git commit -m "[skip ci]: Automated version bump 1.2.4"'],
        ['git push'],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(0);
      expect(mockExitSuccess).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith(
        'No matches found; using default bump type: patch'
      );
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    }
  });
  it('exits when the there is no associated pull request', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Neil Armstrong',
      'INPUT_AUTHOR-EMAIL': 'narmstrong@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      'INPUT_KEYWORDS-MINOR': 'feat',
      GITHUB_EVENT_PATH: '/workspace/event.json',
    });
    mockReadFileSync.mockReturnValueOnce(getFileBuffer({ pull_request: null }));
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      // check execute commands
      expect(mockExecute.mock.calls).toEqual([
        ["git config --local user.name 'Neil Armstrong'"],
        ["git config --local user.email 'narmstrong@github.com'"],
      ]);
      expect(mockExitFailure).toHaveBeenCalledTimes(1);
      expect(mockExitFailure).toHaveBeenCalledWith(
        'Action failed; with error: AssertionError [ERR_ASSERTION]: This event has no associated pull request'
      );
      expect(mockExitSuccess).toHaveBeenCalledTimes(0);
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    }
  });
  it('exits when the package.json version is invalid', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Buzz Aldrin',
      'INPUT_AUTHOR-EMAIL': 'baldrin@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      'INPUT_KEYWORDS-MINOR': 'feat',
    });
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        pull_request: {
          title: 'feat: A cool feature',
          labels: ['enhancement'],
        },
      })
    );
    mockReadFileSync.mockReturnValueOnce(getFileBuffer({ version: 'a.b.c' }));
    try {
      await run();
      // the above line will "throw" when process.exit is called
      // if not, this next line will fail the test
      expect('the answer to life the universe and everything').toEqual(42);
    } catch (e) {
      expect(mockExitFailure).toHaveBeenCalledTimes(1);
      expect(mockExitFailure).toHaveBeenCalledWith(
        'Action failed; with error: AssertionError [ERR_ASSERTION]: Invalid package.json version'
      );
      expect(mockExitSuccess).toHaveBeenCalledTimes(0);
      expect(mockReadFileSync).toHaveBeenCalledTimes(2);
    }
  });
});
