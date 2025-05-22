import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  commands: {
    toggle_side_panel: {
      suggested_key: {
        default: 'Alt+E',
        mac: 'Alt+E',
      },
      description: 'Toggle the side panel.',
    },
  },
  browser_specific_settings: {
    gecko: {
      id: 'example@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: '__MSG_extensionDescription__',
  host_permissions: ['<all_urls>', 'http://localhost:3000/*'],
  permissions: ['storage', 'scripting', 'tabs', 'notifications', 'sidePanel', 'windows', 'activeTab', 'cookies'],
  options_page: 'options/index.html',
  background: {
    service_worker: 'background.iife.js',
    type: 'module',
  },
  action: {
    // default_popup: 'popup/index.html',
    default_icon: 'icon-34.png',
  },
  chrome_url_overrides: {
    // newtab: 'new-tab/index.html',
  },
  icons: {
    128: 'icon-128.png',
    48: 'icon-48.png',
    34: 'icon-34-gray.png',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content/index.iife.js'],
    },
    {
      matches: ['<all_urls>'],
      js: ['content-ui/index.iife.js'],
    },
    {
      matches: ['<all_urls>'],
      css: ['content.css'],
    },
    // {
    //   matches: ["http://localhost:3000/login*"],
    //   js: ["src/contentScript.js"]
    // }
  ],
  devtools_page: 'devtools/index.html',
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon-34.png', 'formLoader.html'],
      matches: ['*://*/*'],
    },
  ],
  externally_connectable: {
    matches: [
      'https://linxly-nextjs.vercel.app/*',
      // 如果您在本地開發後台，也加入本地位址，例如:
      'http://localhost:3000/*',
    ],
  },
  // side_panel: {
  //   default_path: 'side-panel/index.html',
  // },
};

export default manifest;
