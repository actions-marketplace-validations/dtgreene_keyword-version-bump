# Bump and Tag V1

This action bumps a project's `package.json` version and creates a corresponding tag on the default branch.

Currently the action relies on being triggered by a pull request and searches the pull request's title for keyword matches.

[Webhook payload example](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#webhook-payload-example)

# Usage

<!-- start usage -->
```yaml
- uses: 'shipt/bump-and-tag@v1'
  with:
    # Case-sensitive, comma-separated list of words that trigger a major version bump.
    # Compared against the workflow event's pull request title.
    # Default: 'MAJOR'
    keywords-major: ''
    # Case-sensitive, comma-separated list of words that trigger a minor version bump.
    # Compared against the workflow event's pull request title.
    # Default: 'feat'
    keywords-minor: ''
    # Case-sensitive, comma-separated list of words that trigger a patch version bump.
    # Compared against the workflow event's pull request title.
    # Default: 'patch,fix,bug'
    keywords-patch: ''
    # The author name used when making commits on behalf of the action.
    # Default: 'Bump and tag action'
    author-name: ''
    # The author email used when making commits on behalf of the action.
    # Default: 'bump-and-tag-action@noreply.github.com'
    author-email: ''
    # The bump type to use when no words are matched with the workflow event's pull request title.
    # If left blank, and no bump type can be determined, the action will exit.
    # Default: 'patch'
    default-bump-type: ''
    # Case-sensitive, comma-separated list of allowed bump types.
    # If the determined bump type is not in this list, the action will exit.
    # Default: 'major,minor,patch'
    allowed-bump-types: ''
    # If the latest tag is newer after bumping the package version, this flag indicates whether to sync with the tag and perform the bump again.  Otherwise, the action will exit.
    # Default: false
    sync-package-tag: ''
```
<!-- end usage -->

# Workflow example

Intended to be used with [actions/checkout@v3](https://github.com/actions/checkout) to checkout the repo and setup the proper authentication for committing.

In order for the checkout action to properly setup ssh, the `ssh-key` property needs to be supplied through one of the repo's action secrets.  The ssh key will need to belong to a user with permission to commit directly to the default branch (usually an admin if branch protection is enabled).

<!-- start usage -->
```yaml
name: 'Push Tag'

on:
  pull_request:
    branches: 
      - main
    types: [closed]

jobs:
  bump_and_tag:
    name: Bump and Tag
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.merged }}
    env: 
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: 'Checkout source code'
        uses: 'actions/checkout@v3'
        with:
          persist-credentials: true
          ref: ${{ github.ref }}
          ssh-key: ${{ secrets.SSH_KEY }}
      - name: 'Bump version and create tag'
        id: version-bump
        uses: 'shipt/bump-and-tag@v1'
        with:
          wording-major: 'MAJOR'
          wording-minor: 'feat'
          wording-patch: 'patch,fix,bug'
```
<!-- end usage -->