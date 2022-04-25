import * as assert from 'assert';
import * as core from '@actions/core';
import { exitFailure, loadJson } from './utils';

type BumpType = {
  type: string;
  keywords: string[];
};

export class ActionConfig {
  bumpTypes: BumpType[] = [];
  defaultBumpType: string = '';
  commitMessage: string = '';
  constructor() {
    // first, the action configuration from the yaml will be applied
    this.bumpTypes = [
      {
        type: 'major',
        keywords: core.getInput('keywords-major').split(','),
      },
      {
        type: 'minor',
        keywords: core.getInput('keywords-minor').split(','),
      },
      {
        type: 'patch',
        keywords: core.getInput('keywords-patch').split(','),
      },
    ];
    this.defaultBumpType = core.getInput('default-bump-type');
    this.commitMessage = core.getInput('commit-message');
    const configPath = core.getInput('configuration');
    if (configPath) {
      const configJson = loadJson(configPath);
      // keywords
      if (configJson.bump_types) {
        // remove existing bump types that are defined in the configuration file
        this.bumpTypes = this.bumpTypes.filter(({ type }) => {
          return (
            configJson.bump_types.find(
              (bump_type: any) => bump_type.type === type
            ) === undefined
          );
        });
        // add bump types
        this.bumpTypes = this.bumpTypes.concat(configJson.bump_types);
      }
      // default bump type
      if (configJson.default_bump_type) {
        this.defaultBumpType = configJson.default_bump_type;
      }
      // commit message
      if (configJson.commit_message) {
        this.commitMessage = configJson.commit_message;
      }
    }

    // clean up bump types and filter any with no keywords
    this.bumpTypes = this.bumpTypes
      .map(({ type, keywords }) => ({
        type,
        keywords: this.cleanWords(keywords),
      }))
      .filter(({ keywords }) => keywords.length > 0);

    // verify the config at least has a commit message and either bump types or a default bump type
    try {
      assert.ok(this.commitMessage, 'Commit message is undefined');
      assert.ok(
        this.bumpTypes.length !== 0 || this.defaultBumpType,
        'No bump types found and no default bump type given'
      );
    } catch (e) {
      exitFailure(`Configuration is invalid; with error: ${e}`);
    }
  }
  cleanWords = (words: string[]) => {
    return words.map((word) => word.trim()).filter(Boolean);
  };
}
