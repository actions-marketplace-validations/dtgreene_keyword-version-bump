import * as assert from 'assert';
import * as path from 'path';
import * as semver from 'semver';
import * as jsonfile from 'jsonfile';
import {
  logger,
  execute,
  exitFailure,
  exitSuccess,
  getJson,
  getGithubVar,
} from './utils';
import { ActionConfig } from './action-config';

type PullRequest = {
  title: string;
  labels: string[];
};

type WebhookPayload = {
  pull_request: PullRequest;
  head_commit: {
    message: string;
  };
};

export async function run() {
  try {
    // parse our action configuration
    const config = new ActionConfig();
    // configure git author
    execute(`git config --local user.name '${config.author.name}'`);
    execute(`git config --local user.email '${config.author.email}'`);
    // get the workflow event payload
    const eventPath = getGithubVar('event_path');
    const eventJson = getJson(eventPath) as WebhookPayload;
    // verify there is an associated pull request
    assert.ok(
      eventJson.pull_request,
      'This event has no associated pull request'
    );

    // eventJson.head_commit.message
    // tood: fallback to looking at the head_commit message if no pull_request

    // get the package.json
    const packagePath = path.join(getGithubVar('workspace'), 'package.json');
    const packageJson = getJson(packagePath);
    // parse the current version
    const currentVersion = semver.valid(packageJson.version);
    assert.ok(currentVersion, 'Invalid package.json version');
    // bump the version
    const bumpType = getBumpType(config, eventJson.pull_request);
    const bumpedVersion = semver.inc(
      currentVersion,
      bumpType as semver.ReleaseType
    );
    assert.ok(
      bumpedVersion,
      `Invalid version after bumping with type: ${bumpType}`
    );
    // update and save the package.json
    packageJson.version = bumpedVersion;
    jsonfile.writeFileSync(packagePath, packageJson);
    // commit and push the version bump changes
    execute('git add ./package.json');
    execute(
      `git commit -m "${getCommitMessage(config.commitMessage, bumpedVersion)}"`
    );
    execute('git push');
    exitSuccess(`Bumped version from ${currentVersion} to ${bumpedVersion}`);
  } catch (e) {
    exitFailure(`Action failed; with error: ${e}`);
  }
}

function getCommitMessage(message: string, version: string) {
  return message.replace(/{version}/g, version);
}

function getBumpType(config: ActionConfig, pullRequest: PullRequest) {
  let matchResult = '';

  for (let i = 0; i < config.bumpTypes.length; i++) {
    const { type, keywords, labels } = config.bumpTypes[i];

    // check the keywords
    const matchedKeyword = keywords.find((word) =>
      pullRequest.title.includes(word)
    );
    if (matchedKeyword) {
      logger.special(
        `Matched keyword: ${matchedKeyword} in title: ${pullRequest.title}`
      );
      matchResult = type;
      break;
    }

    // check the labels
    const matchedLabel = labels.find((word) =>
      pullRequest.labels.includes(word)
    );
    if (matchedLabel) {
      logger.special(`Matched label: ${matchedLabel}`);
      matchResult = type;
      break;
    }
  }

  if (!matchResult) {
    logger.special(
      `No matches found; using default bump type: ${config.defaultBumpType}`
    );
    matchResult = config.defaultBumpType;
  }

  return matchResult;
}
