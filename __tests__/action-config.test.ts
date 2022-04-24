import * as fs from 'fs';
import * as core from '@actions/core';
import { ActionConfig } from '../src/action-config';
import { getFileBuffer, getCoreInputMock } from './test-utils';

// mock fs
const mockReadFileSync = fs.readFileSync as jest.Mock;
jest.mock('fs');

// mock utils
const mockExitFailure = jest.fn().mockImplementation(() => {
  throw new Error();
});
jest.mock('../src/utils', () => ({
  ...(jest.requireActual('../src/utils') as object),
  exitFailure: (message?: string) => mockExitFailure(message),
}));

// mock child_process
jest.mock('child_process');

// mock core
const mockGetInput = core.getInput as jest.Mock;
jest.mock('@actions/core');

describe('utils', () => {
  afterEach(() => {
    mockGetInput.mockClear();
  });
  it('parses the yaml configuration', async () => {
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
        'keywords-major': 'MAJOR',
        'keywords-minor': 'feat',
        'keywords-patch': 'fix,bug',
        'default-bump-type': 'patch',
      })
    );
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
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        configuration: 'some/path/config.json',
      })
    );
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
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
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
    mockGetInput.mockImplementation(
      getCoreInputMock({
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
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
        'author-name': 'Rob Schneider',
        'author-email': 'rschneider@github.com',
        'commit-message': '[skip ci]: Automated version bump {version}',
      })
    );
    expect(() => new ActionConfig()).toThrow();
    expect(mockExitFailure).toBeCalledWith(
      'Configuration is invalid; with error: AssertionError [ERR_ASSERTION]: No bump types found and no default bump type given'
    );
  });
});
