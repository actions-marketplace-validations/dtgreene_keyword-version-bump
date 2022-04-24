# Auto Bumper

This action bumps and commits an npm project's `package.json` version using the [Semantic Versioning system](https://semver.org/)

Currently the action relies on being triggered by an event related to a pull request.  Each bump type can be configured with both keywords and labels as triggers.  For each bump type, a match is determined by either a keyword being found in the pull request's title or a label matching one of the pull request's labels.

Bump type labels can only be specified when using an external configuration file.

# Usage

<!-- start usage -->
```yaml
- uses: 'dtgreene/actions-auto-bumper@v1'
  with:
    # Case-sensitive, comma-separated list of words that trigger a major version bump.
    # Default: ''
    keywords-major: ''
    # Case-sensitive, comma-separated list of words that trigger a minor version bump.
    # Default: ''
    keywords-minor: ''
    # Case-sensitive, comma-separated list of words that trigger a patch version bump.
    # Default: ''
    keywords-patch: ''
    # The default bump type used when no bump type can be determined by searching.
    # If left blank, and no bump type can be determined, the action will exit without bumping.
    # Default: ''
    default-bump-type: ''
    # The author name used when making commits on behalf of the action.
    # Default: ''
    author-name: ''
    # The author email used when making commits on behalf of the action.
    # Default: ''
    author-email: ''
    # The commit message to use when bumping the version. {version} will be replaced with the new version.
    # https://github.blog/changelog/2021-02-08-github-actions-skip-pull-request-and-push-workflows-with-skip-ci/
    # Default: '[skip ci]: Automated version bump {version}'
    commit-message: ''
```
<!-- end usage -->

# Workflow example

This action relies on [actions/checkout](https://github.com/actions/checkout/) setting up the repo with the correct authentication.

### example-auto-bumper.yml

<!-- start workflow1 -->
```yaml
name: 'Bump Version'

on:
  pull_request:
    branches: 
      - main
    types: [closed]

jobs:
  bump_version:
    name: Bump Version
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.merged }}
    env: 
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: 'Checkout Repo'
        uses: 'actions/checkout@v3'
        with:
          persist-credentials: true
          ref: ${{ github.ref }}
          ssh-key: ${{ secrets.SSH_KEY }}
      - name: 'Auto Bumper'
        uses: 'dtgreene/actions-auto-bumper@v1'
        with:
          author-name: 'Billy Bob'
          author-email: 'bbob@email.com'
          keywords-major: ''
          keywords-minor: 'feat'
          keywords-patch: 'fix,bug'
          default-bump-type: 'minor'
```
<!-- end workflow1 -->

# External configuration file

All of the configuration options available in the workflow yaml can be configured through an external json file.  Configuration options in the external file will over-ride any options found in the workflow yaml.

### example-auto-bumper.yml

<!-- start workflow2 -->
```yaml
- name: 'Bump Version'
  uses: 'dtgreene/actions-auto-bumper@v1'
  with:
    configuration: '.github/workflows/auto-bumper.config.json'
```
<!-- end workflow2 -->

### auto-bumper.config.json

<!-- start config -->
```json
{
  "bump_types": [
    {
      "type": "major",
      "keywords": [],
      "labels": []
    },
    {
      "type": "minor",
      "keywords": ["feat"],
      "labels": ["feature", "enhancement"]
    },
    {
      "type": "patch",
      "keywords": ["patch", "fix", "bug"],
      "labels": ["bug"]
    }
  ],
  "default_bump_type": "patch",
  "author": {
    "name": "Billy Bob",
    "email": "bbob@email.com"
  },
  "commit_message": "[skip ci]: Automated version bump {version}"
}
```
<!-- end config -->
