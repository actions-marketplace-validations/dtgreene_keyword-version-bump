# Keyword Version Bump

This action bumps and commits a node project's version using the [Semantic Versioning system](https://semver.org/). The type of bump is determined by searching a target string with a list of keywords.  The npm package [semver](https://www.npmjs.com/package/semver) is used for incrementing and validating the version.

# Usage

<!-- start usage -->
```yaml
- uses: 'dtgreene/keyword-version-bump@v1'
  with:
    # The target word used for searching for keywords.
    search-target: ''
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
    # The commit message to use when bumping the version. {version} will be replaced with the new version.
    # https://github.blog/changelog/2021-02-08-github-actions-skip-pull-request-and-push-workflows-with-skip-ci/
    # Default: '[skip ci]: Automated version bump {version}'
    commit-message: ''
    # Path to an external json configuration file
    # Default: ''
    configuration: ''
```
<!-- end usage -->

The keywords for `major`, `minor`, and `patch` bump types can be configured via the workflow.  Additional bump types can be configured when using an external configuration file.  

The available bump types are:
- `major`
- `premajor`
- `minor`
- `preminor`
- `patch`
- `prepatch`
- `prerelease`

# Workflow example

This action relies on [actions/checkout](https://github.com/actions/checkout/) for checking out the repo and setting up the environment.

### example-bump-workflow.yml

<!-- start workflow1 -->
```yaml
name: Bump Version

on:
  pull_request:
    branches: 
      - main
    types: [closed]

jobs:
  checkout_and_bump:
    name: Checkout and Bump
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.merged }}
    env: 
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - name: Checkout Repo
        uses: 'actions/checkout@v3'
        with:
          persist-credentials: true
          ref: ${{ github.ref }}
          ssh-key: ${{ secrets.SSH_KEY }}
      - name: Setup Author
        run: |
          git config --local user.name 'Version Bump'
          git config --local user.email 'version-bump@github.fake'
      - name: Bump Version
        uses: 'dtgreene/keyword-version-bump@main'
        with:
          search-target: ${{ github.event.pull_request.title }}
          keywords-major: ''
          keywords-minor: 'feat'
          keywords-patch: 'fix,bug'
          default-bump-type: 'minor'
```
<!-- end workflow1 -->

# External configuration file

All of the configuration options besides the `search-target` can be configured through an external json file.  Configuration options in the external file will over-ride any options given through the workflow yaml.

### example-bump-workflow.yml

<!-- start workflow2 -->
```yaml
- name: Bump Version
  uses: 'dtgreene/keyword-version-bump@main'
  with:
    search-target: ${{ github.event.pull_request.title }}
    configuration: '.github/workflows/version-bump.config.json'
```
<!-- end workflow2 -->

### version-bump.config.json

<!-- start config -->
```json
{
  "bump_types": [
    {
      "type": "major",
      "keywords": [],
    },
    {
      "type": "minor",
      "keywords": ["feat"],
    },
    {
      "type": "patch",
      "keywords": ["patch", "fix", "bug"],
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

# Output
<!-- start output -->
```yaml
# The package version after being bumped
- bumped_version: ''
```
<!-- end output -->
