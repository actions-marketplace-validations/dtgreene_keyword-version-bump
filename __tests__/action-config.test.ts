import * as fs from 'fs';
import { ActionConfig } from '../src/action-config';
import { getFileBuffer, setActionVars, resetActionVars } from './test-utils';

const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockExitFailure = jest.fn().mockImplementation(() => {
  throw new Error();
});

jest.mock('../src/utils', () => ({
  ...(jest.requireActual('../src/utils') as object),
  exitFailure: (message?: string) => mockExitFailure(message),
}));
jest.mock('child_process');
jest.mock('fs');

describe('utils', () => {
  afterEach(() => {
    resetActionVars();
  });
  it('parses the yaml configuration', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
      'INPUT_KEYWORDS-MAJOR': 'MAJOR',
      'INPUT_KEYWORDS-MINOR': 'feat',
      'INPUT_KEYWORDS-PATCH': 'fix,bug',
      'INPUT_DEFAULT-BUMP-TYPE': 'patch',
    });
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['MAJOR'], labels: [] },
      { type: 'minor', keywords: ['feat'], labels: [] },
      { type: 'patch', keywords: ['fix', 'bug'], labels: [] },
    ]);
    expect(config.defaultBumpType).toEqual('patch');
    expect(config.commitMessage).toEqual(
      '[skip ci]: Automated version bump {version}'
    );
    expect(config.author).toEqual({
      name: 'Rob Schneider',
      email: 'rschneider@github.com',
    });
  });
  it('parses the json configuration', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      INPUT_CONFIGURATION: 'some/path/config.json',
    });
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        bump_types: [
          {
            type: 'major',
            keywords: ['MAJOR'],
            labels: [],
          },
          {
            type: 'minor',
            keywords: ['feat'],
            labels: ['enhancement'],
          },
          {
            type: 'patch',
            keywords: ['patch', 'fix', 'bug'],
            labels: ['bug', 'fix'],
          },
        ],
        default_bump_type: 'patch',
        commit_message: '[skip ci]: Automated version bump {version}',
      })
    );
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['MAJOR'], labels: [] },
      { type: 'minor', keywords: ['feat'], labels: ['enhancement'] },
      {
        type: 'patch',
        keywords: ['patch', 'fix', 'bug'],
        labels: ['bug', 'fix'],
      },
    ]);
    expect(config.defaultBumpType).toEqual('patch');
    expect(config.commitMessage).toEqual(
      '[skip ci]: Automated version bump {version}'
    );
    expect(config.author).toEqual({
      name: 'Rob Schneider',
      email: 'rschneider@github.com',
    });
  });
  it('overwrites yaml configuration with json configuration', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: YAML rules',
      'INPUT_KEYWORDS-MAJOR': 'MAJOR',
      'INPUT_KEYWORDS-MINOR': 'feat',
      'INPUT_KEYWORDS-PATCH': 'fix,bug',
      INPUT_CONFIGURATION: 'some/path/config.json',
    });
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        bump_types: [
          {
            type: 'major',
            keywords: ['BREAKING'],
            labels: [],
          },
          {
            type: 'minor',
            keywords: ['amazing'],
            labels: ['enhancement'],
          },
          {
            type: 'patch',
            keywords: ['bump'],
            labels: ['bug', 'fix'],
          },
        ],
        default_bump_type: 'minor',
        commit_message: '[skip ci]: JSON rules',
      })
    );
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['BREAKING'], labels: [] },
      { type: 'minor', keywords: ['amazing'], labels: ['enhancement'] },
      {
        type: 'patch',
        keywords: ['bump'],
        labels: ['bug', 'fix'],
      },
    ]);
    expect(config.defaultBumpType).toEqual('minor');
    expect(config.commitMessage).toEqual('[skip ci]: JSON rules');
    expect(config.author).toEqual({
      name: 'Rob Schneider',
      email: 'rschneider@github.com',
    });
  });
  it('requires commit message', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      'INPUT_KEYWORDS-MAJOR': 'MAJOR',
      'INPUT_DEFAULT-BUMP-TYPE': 'patch',
    });
    expect(() => new ActionConfig()).toThrow();
    expect(mockExitFailure).toBeCalledWith(
      'Configuration is invalid; with error: AssertionError [ERR_ASSERTION]: Commit message is undefined'
    );
  });
  it('requires keywords or a default bump type', async () => {
    setActionVars({
      'INPUT_AUTHOR-NAME': 'Rob Schneider',
      'INPUT_AUTHOR-EMAIL': 'rschneider@github.com',
      'INPUT_COMMIT-MESSAGE': '[skip ci]: Automated version bump {version}',
    });
    expect(() => new ActionConfig()).toThrow();
    expect(mockExitFailure).toBeCalledWith(
      'Configuration is invalid; with error: Error: No bump types found and no default bump type given'
    );
  });
});
