import path from "node:path";
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
        icon: path.resolve(__dirname, "assets/icon.icns"),
        name: "xphpMyAdmin",
      },
      ["darwin"]
    ),
    new MakerZIP({}, ["darwin", "win32", "linux"]),
    new MakerSquirrel({
      name: "xphpmyadmin-desktop",
      setupIcon: path.resolve(__dirname, "assets/icon.ico"),
    }),
    new MakerDeb({
      options: {
        bin: "xphpmyadmin-desktop",
        categories: ["Development", "Utility"],
        desktopTemplate: path.resolve(__dirname, "build-app/desktop.ejs"),
        icon: path.resolve(__dirname, "assets/icon.png"),
        mimeType: ["x-scheme-handler/xphpmyadmin"],
        name: "xphpmyadmin-desktop",
        productName: "xphpMyAdmin Desktop",
      },
    }),
    new MakerRpm({
      options: {
        bin: "xphpmyadmin-desktop",
        categories: ["Development", "Utility"],
        icon: path.resolve(__dirname, "assets/icon.png"),
        mimeType: ["x-scheme-handler/xphpmyadmin"],
        name: "xphpmyadmin-desktop",
        productName: "xphpMyAdmin Desktop",
      },
    }),
  ],
  packagerConfig: {
    asar: true,
    executableName: "xphpmyadmin-desktop",
    extraResource: [path.resolve(__dirname, "assets")],
    icon: path.resolve(__dirname, "assets/icon"),
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
