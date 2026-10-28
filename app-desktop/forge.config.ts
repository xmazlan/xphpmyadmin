import { FuseV1Options, FuseVersion } from "@electron/fuses";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerRpm } from "@electron-forge/maker-rpm";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerZIP } from "@electron-forge/maker-zip";
import { FusesPlugin } from "@electron-forge/plugin-fuses";
import { VitePlugin } from "@electron-forge/plugin-vite";
import type { ForgeConfig } from "@electron-forge/shared-types";

const config: ForgeConfig = {
  makers: [
    new MakerDMG(
      {
        name: "xphpMyAdmin",
      },
      ["darwin"]
    ),
    new MakerZIP({}, ["darwin", "win32", "linux"]),
    new MakerSquirrel({
      name: "xphpmyadmin",
    }),
    new MakerDeb({
      options: {
        bin: "xphpmyadmin",
        name: "xphpmyadmin",
        productName: "xphpMyAdmin",
      },
    }),
    new MakerRpm({
      options: {
        bin: "xphpmyadmin",
        name: "xphpmyadmin",
        productName: "xphpMyAdmin",
      },
    }),
  ],
  packagerConfig: {
    asar: true,
    executableName: "xphpmyadmin-desktop",
    name: "xphpMyAdmin",
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          config: "vite.main.config.mts",
          entry: "src/main.ts",
          target: "main",
        },
        {
          config: "vite.preload.config.mts",
          entry: "src/preload.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          config: "vite.renderer.config.mts",
          name: "main_window",
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      resetAdHocDarwinSignature: process.platform === "darwin",
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      config: {
        draft: true,
        prerelease: false,
        repository: {
          name: "xphpmyadmin",
          owner: "ajoroby",
        },
      },
      name: "@electron-forge/publisher-github",
    },
  ],
  rebuildConfig: {},
};

export default config;
