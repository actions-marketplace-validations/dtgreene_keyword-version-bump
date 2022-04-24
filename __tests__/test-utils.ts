const defaultEnv = {
  GITHUB_WORKSPACE: '',
  GITHUB_EVENT_PATH: '',
};

export function resetEnv() {
  Object.entries(defaultEnv).forEach(([key]) => {
    process.env[key] = undefined;
  });
}

export function setEnv(env: object) {
  // overwrite any given env variables
  Object.entries(Object.assign({}, defaultEnv, env)).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

export function getFileBuffer(data: object) {
  return Buffer.from(JSON.stringify(data));
}

export function getCoreInputMock(env: { [key: string]: string }) {
  return (key: string) => {
    return env[key] ?? '';
  };
}
