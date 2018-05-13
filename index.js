#!/usr/bin/env node

let yaml = require("./lib/yaml.js");

const {
  argv
} = require("yargs");
const _ = require("lodash");

let {
  target,
  source,
  config
} = argv;

if (!_.isNil(target) && !_.isNil(source) && !_.isNil(config)) {
  yaml.compile(source, target, config);
} else {
  console.log("Please fill in all required parameters\n\t--source\t[PATH] path to source file\n\t--config\t[PATH] path to configuration file\n\t--target\t[PATH] path to target file");
}