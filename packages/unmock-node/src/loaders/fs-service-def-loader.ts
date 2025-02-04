import debug from "debug";
import fs from "fs";
import path from "path";
import { IServiceDef, IServiceDefLoader } from "unmock-core";

const DEFAULT_SERVICE_SUBDIRECTORY = "__unmock__";

export interface IFsServiceDefLoaderOptions {
  servicesDir?: string;
}

const debugLog = debug("unmock:fs-service-def-loader");

/**
 * Read services from file system. Base directory is either
 * 1. Directory injected in configuration
 * 2. Environment variable `UNMOCK_SERVICES_DIRECTORY`
 * 3. `${process.cwd()}/__unmock__`
 */
export class FsServiceDefLoader implements IServiceDefLoader {
  /**
   * Read service parser input from directory containing all the files for a given service.
   * @param absoluteDirectory Absolute path to service directory. For example, /path/to/__unmock__/petstore/
   * @returns Input for service parser to parse a service
   */
  public static readServiceDirectory(absoluteDirectory: string): IServiceDef {
    const serviceFiles = fs
      .readdirSync(absoluteDirectory)
      .map((fileName: string) => path.join(absoluteDirectory, fileName))
      .filter((fileName: string) => fs.statSync(fileName).isFile())
      .map((f: string) => ({
        basename: path.basename(f),
        contents: fs.readFileSync(f).toString("utf-8"),
      }));

    return {
      directoryName: path.basename(absoluteDirectory),
      serviceFiles,
    };
  }

  /**
   * Resolve the absolute path to the directory where services live, with the flow:
   * 1. Injected directory
   * 2. Environment variable
   * 3. ${process.cwd()}/__unmock__
   * TODO: Use `app-root-path` instead of `process.cwd()`?
   */
  private static resolveServicesDirectory(servicesDirOpt?: string) {
    const servicesDirectory = path.resolve(
      servicesDirOpt ||
        process.env.UNMOCK_SERVICES_DIRECTORY ||
        path.join(process.cwd(), DEFAULT_SERVICE_SUBDIRECTORY),
    );

    debugLog(`Resolved services directory: ${servicesDirectory}`);
    if (
      fs.existsSync(servicesDirectory) &&
      fs.statSync(servicesDirectory).isDirectory()
    ) {
      return servicesDirectory;
    }

    throw new Error(`Directory ${servicesDirectory} does not exist`);
  }

  private readonly servicesDirectory: string;

  public constructor(options: IFsServiceDefLoaderOptions) {
    this.servicesDirectory = FsServiceDefLoader.resolveServicesDirectory(
      options.servicesDir,
    );
  }

  public async load(): Promise<IServiceDef[]> {
    return this.loadSync(); // Simple wrap in promise for now
  }

  public loadSync(): IServiceDef[] {
    const servicesDirectory: string = this.servicesDirectory;
    const serviceDirectories = fs
      .readdirSync(servicesDirectory)
      .map((f: string) => path.join(servicesDirectory, f))
      .filter((f: string) => fs.statSync(f).isDirectory());

    debugLog(`Found ${serviceDirectories.length} service directories`);

    const serviceDefs = serviceDirectories.map((dir: string) =>
      FsServiceDefLoader.readServiceDirectory(dir),
    );
    return serviceDefs;
  }
}
