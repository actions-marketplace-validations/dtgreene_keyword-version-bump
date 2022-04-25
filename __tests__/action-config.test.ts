import * as fs from 'fs';
import * as core from '@actions/core';
import { ActionConfig } from '../src/action-config';
import { getFileBuffer, getCoreInputMock } from './test-utils';

// mock child_process
jest.mock('child_process');

// mock fs
const mockReadFileSync = fs.readFileSync as jest.Mock;
jest.mock('fs');

// mock core
const mockGetInput = core.getInput as jest.Mock;
jest.mock('@actions/core');

// mock utils
const mockExitFailure = jest.fn().mockImplementation(() => {
  throw new Error();
});
jest.mock('../src/utils', () => ({
  ...(jest.requireActual('../src/utils') as object),
  exitFailure: (message?: string) => mockExitFailure(message),
}));

describe('utils', () => {
  afterEach(() => {
    mockGetInput.mockClear();
  });
  it('parses the yaml configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'commit-message': '[skip ci]: Automated version bump {version}',
        'keywords-major': 'MAJOR',
        'keywords-minor': 'feat',
        'keywords-patch': 'fix,bug',
        'default-bump-type': 'patch',
      })
    );
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['MAJOR'] },
      { type: 'minor', keywords: ['feat'] },
      { type: 'patch', keywords: ['fix', 'bug'] },
    ]);
    expect(config.defaultBumpType).toEqual('patch');
    expect(config.commitMessage).toEqual(
      '[skip ci]: Automated version bump {version}'
    );
  });
  it('parses the json configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        configuration: 'some/path/config.json',
      })
    );
    mockReadFileSync.mockReturnValueOnce(
      getFileBuffer({
        bump_types: [
          {
            type: 'major',
            keywords: ['MAJOR'],
          },
          {
            type: 'minor',
            keywords: ['feat'],
          },
          {
            type: 'patch',
            keywords: ['patch', 'fix', 'bug'],
          },
        ],
        default_bump_type: 'patch',
        commit_message: '[skip ci]: Automated version bump {version}',
      })
    );
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['MAJOR'] },
      { type: 'minor', keywords: ['feat'] },
      {
        type: 'patch',
        keywords: ['patch', 'fix', 'bug'],
      },
    ]);
    expect(config.defaultBumpType).toEqual('patch');
    expect(config.commitMessage).toEqual(
      '[skip ci]: Automated version bump {version}'
    );
  });
  it('overwrites yaml configuration with json configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'commit-message': '[skip ci]: YAML rules',
        'keywords-major': 'MAJOR',
        'keywords-minor': 'feat',
        'keywords-patch': 'fix,bug',
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
          {
            type: 'minor',
            keywords: ['amazing'],
          },
          {
            type: 'patch',
            keywords: ['bump'],
          },
        ],
        default_bump_type: 'minor',
        commit_message: '[skip ci]: JSON rules',
      })
    );
    const config = new ActionConfig();
    expect(config.bumpTypes).toEqual([
      { type: 'major', keywords: ['BREAKING'] },
      { type: 'minor', keywords: ['amazing'] },
      {
        type: 'patch',
        keywords: ['bump'],
      },
    ]);
    expect(config.defaultBumpType).toEqual('minor');
    expect(config.commitMessage).toEqual('[skip ci]: JSON rules');
  });
  it('requires commit message', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'keywords-major': 'MAJOR',
        'default-bump-type': 'patch',
      })
    );
    expect(() => new ActionConfig()).toThrow();
    expect(mockExitFailure).toBeCalledWith(
      'Configuration is invalid; with error: AssertionError [ERR_ASSERTION]: Commit message is undefined'
    );
  });
  it('requires keywords or a default bump type', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'commit-message': '[skip ci]: Automated version bump {version}',
      })
    );
    expect(() => new ActionConfig()).toThrow();
    expect(mockExitFailure).toBeCalledWith(
      'Configuration is invalid; with error: AssertionError [ERR_ASSERTION]: No bump types found and no default bump type given'
    );
  });
});
