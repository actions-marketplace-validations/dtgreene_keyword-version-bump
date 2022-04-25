import * as fs from 'fs';
import { PackageReader } from '../src/package-reader';
import { getFileBuffer } from './test-utils';

// mock fs
const mockReadFileSync = fs.readFileSync as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as jest.Mock;
jest.mock('fs');

// mock utils
const mockExitFailure = jest.fn().mockImplementation(() => {
  throw new Error();
});
jest.mock('../src/utils', () => ({
  ...(jest.requireActual('../src/utils') as object),
  exitFailure: (message?: string) => mockExitFailure(message),
}));

describe('PackageReader', () => {
  it('constructs PackageReader', async () => {
    const mockPackagePath = 'some/path/package.json';
    const mockPackage = { version: '1.2.3' };
    mockReadFileSync.mockReturnValueOnce(getFileBuffer(mockPackage));
    const packageReader = new PackageReader(mockPackagePath);
    packageReader.save();

    expect(packageReader.version).toEqual(mockPackage.version);
    expect(mockWriteFileSync.mock.calls[0]).toEqual([
      mockPackagePath,
      JSON.stringify(mockPackage, null, 2),
    ]);
  });
  it('construction fails with invalid package version', async () => {
    const mockPackagePath = 'some/path/package.json';
    const mockPackage = { version: 'a.b.c' };
    mockReadFileSync.mockReturnValueOnce(getFileBuffer(mockPackage));
    expect(() => {
      new PackageReader(mockPackagePath);
    }).toThrow();
    expect(mockExitFailure).toHaveBeenCalledWith(
      'Could not construct PackageReader; with error: AssertionError [ERR_ASSERTION]: Invalid package version: a.b.c'
    );
  });
});
