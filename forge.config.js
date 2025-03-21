const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { utils: { fromBuildIdentifier } } = require('@electron-forge/core');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

// other stuff
const { execSync } = require('node:child_process')

function get_os(){
  let os_val = undefined
  try {os_val = execSync(`grep '^NAME=' /etc/os-release | sed 's/^[^=]*="//;s/"$//'`).toString().trim()}
  catch(err){
      console.error("Error reading OS value:", err)
      process.exit(1)
  }
  return os_val
}

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
        platforms: ["linux"]
      },
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux"]
      }
    ]
    break
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
    icon: PATH_TO_ICON,
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
