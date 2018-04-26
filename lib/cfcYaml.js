const fs = require("fs");
const path = require("path");
const uuidv4 = require('uuid/v4');
4

const yaml = require("js-yaml");
const detectIndent = require("detect-indent");
const lineByLine = require("n-readlines");
const moment = require("moment");
const _ = require("lodash");
const {
  randomString
} = require('./utils');

const cfcIdentifier = "!CFC";
const regexUuidv4 = /!CFC\s*uuidv4\(.*\)/g;
const regexTimestamp = /!CFC\s*timestamp\(.*\)/g;
const regexRandomString = /!CFC\s*randomString\((.*)\)/g;
const regexTag = /!CFC\s*(\S+)/g;

let compile = (source, target, config) => {
  try {
    let timestamp = new Date();
    let before = new Date();
    let configDocument = yaml.safeLoad(fs.readFileSync(config, "utf8"));
    let configKeys = Object.keys(configDocument);

    let dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      console.log(`Creating ${ dir } since the selected target directory ${ dir } does not exist.`);
      fs.mkdirSync(dir);
    } else {
      try {
        fs.unlinkSync(target);
      } catch (err) {
        // do nothing if file not exists
      }
    }

    let warningsCntr = 0;
    let warnings = [];
    let cntr = 0;
    let liner = new lineByLine(source);
    let line;

    while (line = liner.next()) {
      cntr++;
      let tmpLine = line.toString("utf-8");
      if (tmpLine.match(regexUuidv4)) {
        console.log(`Found cfc instruction on line ${ cntr }: ${ tmpLine.trim() }`);
        let matchedInstruction = tmpLine.match(regexUuidv4)[0];
        fs.appendFileSync(target, `${ tmpLine.replace(matchedInstruction, uuidv4()) }\n`);
        console.log(`Inserting uuidv4() on line ${ cntr }`);
      } else if (tmpLine.match(regexTimestamp)) {
        console.log(`Found cfc instruction on line ${ cntr }: ${ tmpLine.trim() }`);
        let matchedInstruction = tmpLine.match(regexTimestamp)[0];
        fs.appendFileSync(target, `${ tmpLine.replace(matchedInstruction, timestamp) }\n`);
        console.log(`Inserting timestamp() on line ${ cntr }`);
      } else if (tmpLine.match(regexRandomString)) {
        console.log(`Found cfc instruction on line ${ cntr }: ${ tmpLine.trim() }`);
        let matched = regexRandomString.exec(tmpLine);
        let matchedInstruction = matched[0];
        let length = parseInt(matched[1]);
        fs.appendFileSync(target, `${ tmpLine.replace(matchedInstruction, randomString(length)) }\n`);
        console.log(`Inserting randomString() with length ${length} on line ${ cntr }`);
      } else if (line.includes(cfcIdentifier)) {
        console.log(`Found cfc instruction on line ${ cntr }: ${ tmpLine.trim() }`);
        let matchedInstruction = tmpLine.match(regexTag)[0];
        let instruction = matchedInstruction.replace(cfcIdentifier, "").trim();

        let found = false;
        configKeys.forEach((key) => {
          if (key === instruction) {
            found = true;
          }
        });
        if (found) {
          console.log(`Inserting ${ instruction } on line ${ cntr }`);

          if (!_.isNil(configDocument[instruction].Template)) {
            let ident = detectIndent(tmpLine).indent;
            let snippetLiner = new lineByLine(configDocument[instruction].Template);
            let snippetLine;

            while (snippetLine = snippetLiner.next()) {
              fs.appendFileSync(target, `${ ident }${ snippetLine }\n`);
            }

          } else if (!_.isNil(configDocument[instruction].Value)) {
            fs.appendFileSync(target, `${ tmpLine.replace(matchedInstruction, configDocument[instruction].Value) }\n`);
          } else {
            console.log(`[WARNING] Unkown instruction type for ${ instruction }`);
            warnings.push(`[WARNING] Unkown instruction type for ${ instruction }`);
            warningsCntr++;
          }

          console.log(`Done inserting ${ instruction } starting on line ${ cntr }`);

        } else {
          console.log(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warnings.push(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warningsCntr++;
        }
      } else {

        fs.appendFileSync(target, `${ line }\n`);
      }
    }
    let after = new Date();
    let duration = moment.duration(moment(after).diff(moment(before)));
    let seconds = duration.asSeconds();

    console.log(`CFC YAML finished after ${ seconds } sec with ${ warningsCntr } warnings. The result can be found under ${ target }`);
    warnings.forEach((warning) => {
      console.log(warning);
    });

  } catch (err) {
    console.log(`Error while compiling YAML: ${ err.stack }`);
  }

};

exports.compile = compile;