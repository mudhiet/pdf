const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    name: 'PDF Editor',
    icon: 'assets/icon',
    extraResource: [],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'PDF_Editor',
        setupIcon: 'assets/icon.ico',
        iconUrl: 'https://raw.githubusercontent.com/user/repo/main/assets/icon.ico',
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-fuses',
      config: {
        fuses: [
          new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          }),
        ],
      },
    },
  ],
};
