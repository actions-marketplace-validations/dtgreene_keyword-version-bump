import * as assert from 'assert';
import * as path from 'path';
import * as semver from 'semver';
import * as jsonfile from 'jsonfile';
import {
  log,
  execute,
  exitFailure,
  exitSuccess,
  getJson,
  getGithubVar,
} from './utils';
import { ActionConfig } from './action-config';

type WebhookPayload = {
  pull_request: PullRequest;
};

type PullRequest = {
  title: string;
  labels: string[];
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
  } catch (e) {
    exitFailure(`Action failed; with error: ${e}`);
  }
  exitSuccess();
}

function getCommitMessage(message: string, version: string) {
  return message.replace(/{version}/g, version);
}

function getBumpType(config: ActionConfig, pullRequest: PullRequest) {
  let matchResult = '';

  for (let i = 0; i < config.bumpTypes.length; i++) {
    const { type, keywords, labels } = config.bumpTypes[i];
    const matchedKeyword = keywords.find((word) =>
      pullRequest.title.includes(word)
    );
    const matchedLabel = labels.find((word) =>
      pullRequest.labels.includes(word)
    );

    if (matchedKeyword) {
      log.info(`🔍 Matched keyword: ${matchedKeyword}`);
    } else if (matchedLabel) {
      log.info(`🔍 Matched label: ${matchedLabel}`);
    }

    if (matchedKeyword || matchedLabel) {
      matchResult = type;
      break;
    }
  }

  if (!matchResult) {
    log.info(
      `🙈 No match found; using default bump type: ${config.defaultBumpType}`
    );
    matchResult = config.defaultBumpType;
  }

  return matchResult;
}
