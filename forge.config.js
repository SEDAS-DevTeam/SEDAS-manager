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
  PATH_TO_ICON
} = require("./src/app_config")
// TODO: after some time, replace beta tags with prod tags

/*
runtime definitions
*/

// OS handling
let maker_array = []
switch (get_os()){
  case "Arch Linux": {
    maker_array = [
      {
        name: "@electron-forge/maker-appimage",
        config: {}
      },
      {
        name: "@electron-forge/maker-zip",
        platforms: ["linux"]
      },
      {
        name: "@electron-forge/maker-tar",
        config: {}
      }
    ]
    break
  }
}
console.log(maker_array)


module.exports = {
  packagerConfig: { // configurations for packagers
    name: APP_NAME,
    asar: true,
    osxSign: {},
    appBundleId: fromBuildIdentifier({ beta: APP_IDENTIFIER_BETA, prod: APP_IDENTIFIER_PROD }),
    icon: PATH_TO_ICON
  },
  rebuildConfig: { // rebuild configuration
    force: true
  },
  makers: ,
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
