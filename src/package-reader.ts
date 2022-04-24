import * as assert from 'assert';
import * as semver from 'semver';
import { PackageJson } from 'type-fest';
import { exitFailure, loadJson, saveJson } from './utils';

export class PackageReader {
  packagePath: string = '';
  package: PackageJson = {};
  version: string = '';
  constructor(packagePath: string) {
    try {
      this.packagePath = packagePath;
      // get the package.json
      this.package = loadJson(this.packagePath);

      // verify the current version
      const currentVersion = semver.valid(this.package.version);
      assert.ok(
        currentVersion,
        `Invalid package version: ${this.package.version}`
      );

      this.version = currentVersion;
    } catch (e) {
      exitFailure(`Could not construct PackageReader; with error: ${e}`);
    }
  }
  save = () => {
    try {
      // save the package.json
      this.package.version = this.version;
      saveJson(this.packagePath, this.package);
    } catch (e) {
      exitFailure(`Could not save package; with error: ${e}`);
    }
  };
}
