const envKeys = [
  'INPUT_AUTHOR-NAME',
  'INPUT_AUTHOR-EMAIL',
  'INPUT_DEFAULT-BUMP-TYPE',
  'INPUT_KEYWORDS-MAJOR',
  'INPUT_KEYWORDS-MINOR',
  'INPUT_KEYWORDS-PATCH',
  'INPUT_COMMIT-MESSAGE',
  'INPUT_CONFIGURATION',
  'GITHUB_WORKSPACE',
  'GITHUB_EVENT_PATH',
];

export function resetActionVars() {
  envKeys.forEach((key) => (process.env[key] = undefined));
}

export function setActionVars(vars: object) {
  // define all env variables as an empty string
  const defaultVars: { [key: string]: string } = {};
  envKeys.forEach((key) => (defaultVars[key] = ''));
  // overwrite any given env variables
  Object.entries(Object.assign({}, defaultVars, vars)).forEach(
    ([key, value]) => {
      process.env[key] = value;
    }
  );
}

export function getFileBuffer(data: object) {
  return Buffer.from(JSON.stringify(data));
}
