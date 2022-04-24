import * as assert from 'assert';
import * as core from '@actions/core';
import { exitFailure, loadJson } from './utils';

type BumpType = {
  type: string;
  keywords: string[];
  labels: string[];
};

type GithubAuthor = {
  name: string;
  email: string;
};

export class ActionConfig {
  bumpTypes: BumpType[] = [];
  defaultBumpType: string = '';
  commitMessage: string = '';
  author: GithubAuthor = {
    name: '',
    email: '',
  };
  constructor() {
    // first, the action configuration from the yaml will be applied
    this.bumpTypes = [
      {
        type: 'major',
        keywords: core.getInput('keywords-major').split(','),
        labels: [],
      },
      {
        type: 'minor',
        keywords: core.getInput('keywords-minor').split(','),
        labels: [],
      },
      {
        type: 'patch',
        keywords: core.getInput('keywords-patch').split(','),
        labels: [],
      },
    ];
    this.defaultBumpType = core.getInput('default-bump-type');
    this.commitMessage = core.getInput('commit-message');
    this.author = {
      name: core.getInput('author-name'),
      email: core.getInput('author-email'),
    };
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
      // author
      if (configJson.author) {
        this.author.name = configJson.author.name;
        this.author.email = configJson.author.email;
      }
    }

    // clean up bump types and filter any with no keywords
    this.bumpTypes = this.bumpTypes
      .map(({ type, keywords, labels }) => ({
        type,
        keywords: this.cleanWords(keywords),
        labels: this.cleanWords(labels),
      }))
      .filter(
        ({ keywords, labels }) => keywords.length > 0 || labels.length > 0
      );

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
