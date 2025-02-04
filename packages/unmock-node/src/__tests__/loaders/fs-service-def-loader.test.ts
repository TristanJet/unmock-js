import path from "path";
import { IServiceDef } from "unmock-core";
import { FsServiceDefLoader } from "../../loaders/fs-service-def-loader";

const RESOURCES_DIR = path.join(__dirname, "resources");

describe("File system service def loader", () => {
  it("loads serviceDefs from existing directory", () => {
    const serviceDefLoader = new FsServiceDefLoader({
      servicesDir: RESOURCES_DIR,
    });
    const serviceDefs: IServiceDef[] = serviceDefLoader.loadSync();
    expect(serviceDefs).toHaveLength(1);
    const serviceDef = serviceDefs[0];
    expect(serviceDef.directoryName).toBe("petstore");
  });
  it("loads serviceDefs from existing directory asynchronously", async () => {
    const serviceDefLoader = new FsServiceDefLoader({
      servicesDir: RESOURCES_DIR,
    });
    const serviceDefs: IServiceDef[] = await serviceDefLoader.load();
    expect(serviceDefs).toHaveLength(1);
    const serviceDef = serviceDefs[0];
    expect(serviceDef.directoryName).toBe("petstore");
  });

  it("throws for a non-existing directory", () => {
    expect(
      () =>
        new FsServiceDefLoader({
          servicesDir: "DEFINITELY_DOES_NOT_EXIST_I_HOPE",
        }),
    ).toThrow(/does not exist/);
  });

  it("load serviceDefs from a single directory", () => {
    const absolutePath = path.join(RESOURCES_DIR, "petstore");
    const serviceDef = FsServiceDefLoader.readServiceDirectory(absolutePath);
    expect(serviceDef.directoryName).toBe("petstore");
    expect(serviceDef.serviceFiles).toHaveLength(1);

    const serviceFile = serviceDef.serviceFiles[0];
    expect(serviceFile.basename).toBe("index.yaml");
    expect(serviceFile.contents).toEqual(
      expect.stringContaining('openapi: "3.0.0"'),
    );
  });
});
