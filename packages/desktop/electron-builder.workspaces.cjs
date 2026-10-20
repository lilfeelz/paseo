const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const base = yaml.load(fs.readFileSync(path.join(__dirname, "electron-builder.yml"), "utf8"));

module.exports = {
  ...base,
  appId: "org.lilfeelz.paseo-workspaces",
  productName: "Paseo Workspaces",
  executableName: "Paseo Workspaces",
  protocols: [
    {
      name: "Paseo Workspaces agent link",
      schemes: ["paseows"],
    },
  ],
  mac: {
    ...base.mac,
    artifactName: "Paseo-Workspaces-${version}-${arch}.${ext}",
  },
  publish: [],
};
