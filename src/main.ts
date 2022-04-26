import * as core from '@actions/core';
import { logger, execute, exitFailure, exitSuccess } from './utils';
import { ActionConfig } from './action-config';

const bumpTypes = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
] as const;

type BumpType = typeof bumpTypes[number]

export async function run() {
  try {
    // parse our action configuration
    const config = new ActionConfig();
    const searchTarget = core.getInput('search-target', { required: true });

    // get the current version
    // e.g. "1.2.3" (including the double quotes)
    const currentVersion = execute('npm pkg get version').replace(/"/g, '');

    // get the bump type
    // e.g. major | premajor | minor | preminor | patch | prepatch | prerelease
    const bumpType = getBumpType(config, searchTarget);

    // bump the version
    // e.g. 'v1.2.3'
    const bumpCommand = `npm version --no-git-tag-version ${bumpType}`;
    const bumpedVersion = execute(bumpCommand).replace(/v/g, '');

    // commit the changes
    execute(
      `git commit -am "${getCommitMessage(
        config.commitMessage,
        bumpedVersion
      )}"`
    );
    execute('git push');

    // output the newly bumped version
    core.setOutput('bumped_version', bumpedVersion);

    exitSuccess(`Bumped version ${currentVersion} -> ${bumpedVersion}`);
  } catch (e) {
    exitFailure(`Action failed; with error: ${e}`);
  }
}

function getCommitMessage(message: string, version: string) {
  return message.replace(/{version}/g, version);
}

function getBumpType(config: ActionConfig, target: string) {
  let matchResult = '';

  for (let i = 0; i < config.bumpTypes.length; i++) {
    const { type, keywords } = config.bumpTypes[i];

    // check the keywords
    const matchedKeyword = keywords.find((word) => target.includes(word));
    if (matchedKeyword) {
      logger.success(
        `Found keyword match: ${matchedKeyword}; for bump type: ${type}`
      );
      matchResult = type;
      break;
    }
  }

  if (!matchResult) {
    matchResult = config.defaultBumpType;
    logger.warn(`No bump type could be matched; using default: ${matchResult}`);
  } else if (!bumpTypes.includes(matchResult as BumpType)) {
    exitFailure(`Matched bump type is not valid: ${matchResult}`);
  }

  logger.success(`Using bump type: ${matchResult}`);
  return matchResult as BumpType;
}
