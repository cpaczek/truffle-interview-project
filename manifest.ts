import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: chrome.runtime.ManifestV3 = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  options_page: "src/pages/options/index.html",
  background: { service_worker: "src/pages/background/index.js" },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: "icon-34.png",
  },
  chrome_url_overrides: {
    newtab: "src/pages/newtab/index.html",
  },
  icons: {
    "128": "icon-128.png",
  },
  declarative_net_request: {
    rule_resources: [
      {
        id: "change-x-frame-options",
        enabled: true,
        path: "rules.json",
      },
    ],
  },
  permissions: ["declarativeNetRequest", "declarativeNetRequestFeedback", "storage", "topSites"],
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "<all_urls>"],
      js: ["src/pages/content/index.js"],
      all_frames: true,
      // KEY for cache invalidation
      css: ["assets/css/contentStyle<KEY>.chunk.css"],
      run_at: "document_start",
    },
  ],
  devtools_page: "src/pages/devtools/index.html",
  web_accessible_resources: [
    {
      resources: ["assets/js/*.js", "assets/css/*.css", "icon-128.png", "icon-34.png"],
      matches: ["*://*/*"],
    },
  ],
  // TODO: set to more specific value
  host_permissions: ["*://*/*"],
};

export default manifest;
