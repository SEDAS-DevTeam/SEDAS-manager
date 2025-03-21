const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// other stuff
const os = require('os');

// build consts
const {
  APP_NAME,
  APP_IDENTIFIER_BETA,
  APP_IDENTIFIER_PROD,
  APP_TAG_BETA,
  IS_PRERELEASE,
  PATH_TO_ICON,

  // paths
  PATH_TO_OUT,

  // exclusions
  PATH_EXC_ADDONS,
  PATH_EXC_ENV,
  PATH_EXC_DOC,
  PATH_EXC_VSCODE,
  PATH_EXC_GITIGNORE,
  PATH_EXC_GITMODULES,
  PATH_EXC_REQUIREMENTS,
  PATH_EXC_INVOKE,
  PATH_EXC_TSCONF,
  PATH_TO_SRC,
  PATH_TO_PACKAGE
} = require("./src/app_config")
// TODO: after some time, replace beta tags with prod tags

function get_os() {
  const platform = os.platform()
  const release = os.release()

  if (platform === 'linux') {
      try {
          const osInfo = require('fs')
              .readFileSync('/etc/os-release', 'utf8')
              .split('\n')
              .find(line => line.startsWith('NAME='))
              ?.split('=')[1]
              ?.replace(/"/g, '')
              .trim();
          return "Linux"
      } catch (err) {
          return "Linux"
      }
  }

  if (platform === 'darwin') return 'macOS'
  if (platform === 'win32') return `Windows ${release}`

  return "Unknown"
}

/*
runtime definitions
*/

// OS handling
let maker_array = []
switch (get_os()){
  case "Arch Linux": {
    // in order for this to work, you need to have squashfs-tools and zip installed
    maker_array = [
      {
        name: "@reforged/maker-appimage",
        platforms: ["linux"],
        config: {
          options: {
            icon: PATH_TO_ICON
          }
        }
      },
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux"],
        config: {
          options: {
            icon: PATH_TO_ICON
          }
        }
      }
    ]
    break
  }
  case "Ubuntu": {
    maker_array = [
      {
        name: "@reforged/maker-appimage",
        platforms: ["linux"],
        config: {
          options: {
            icon: PATH_TO_ICON
          }
        }
      },
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux"],
        config: {
          options: {
            icon: PATH_TO_ICON
          }
        }
      },
      {
        name: "@electron-forge/maker-deb",
        config: {
          options: {
            maintainer: "Daniel Pojhan", // TODO: maybe later change that
            homepage: "https://github.com/SEDAS-DevTeam",
            icon: PATH_TO_ICON,
            description: "A versatile and scalable ATC simulator"
          }
        }
      }
    ]
  }
  case "Linux": {
    // unspecified Linux distro
    maker_array = [
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux"],
        config: {
          options: {
            icon: PATH_TO_ICON
          }
        }
      }
    ]
  }
  case "Unknown": {
    // unspecified OS platform
    console.error("Unknow OS platform, quitting...")
    process.exit(1)
  }
  default: {
    maker_array = [
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux", "darwin", "win32"]
      }
    ]
  }
}

module.exports = {
  packagerConfig: { // configurations for packagers
    name: APP_NAME,
    asar: true,
    osxSign: {},
    appBundleId: fromBuildIdentifier({ beta: APP_IDENTIFIER_BETA, prod: APP_IDENTIFIER_PROD }),
    packageJson: PATH_TO_PACKAGE, 
    dir: PATH_TO_SRC,
    outDir: PATH_TO_OUT,
    ignore: [
      new RegExp(`.*${PATH_EXC_ADDONS.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_ENV.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_DOC.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_VSCODE.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_GITIGNORE.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_GITMODULES.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_REQUIREMENTS.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_INVOKE.replace('./', '').replace(/\//g, '\\/')}.*`),
      new RegExp(`.*${PATH_EXC_TSCONF.replace('./', '').replace(/\//g, '\\/')}.*`)
    ],
    quiet: false,
    debug: true
  },
  rebuildConfig: { // rebuild configuration
    force: true
  },
  makers: maker_array,
  publishers: [ // publishing to github (TODO)
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: "SEDAS-DevTeam",
          name: "SEDAS-manager"
        },
        prerelease: IS_PRERELEASE,
        draft: true
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
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
  buildIdentifier: APP_TAG_BETA
};
