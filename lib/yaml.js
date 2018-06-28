const fs = require("fs");
const path = require("path");
const uuidv4 = require("uuid/v4");

const yaml = require("js-yaml");
const detectIndent = require("detect-indent");
const lineByLine = require("n-readlines");
const moment = require("moment");
const _ = require("lodash");
const {
  randomString
} = require("./utils");

const regexUuidv4 = /!CFC\s*uuidv4\(\)/g;
const regexTimestamp = /!CFC\s*timestamp\(\)/g;
const regexRandomString = /!CFC\s*randomString\((.*)\)/g;
const regexDefault = /!CFC\s*(\w+)/g;

let checkTemplates = (line, configKeys, configDocument) => {
  let matched = line.match(regexDefault);
  if (!_.isNil(matched)) {
    if (matched.length <= 1) {
      return false;
    }
    let found = 0;
    for (let j = 0; j < matched.length; j++) {
      regexDefault.lastIndex = 0;
      let instruction = regexDefault.exec(matched[j].trim());
      if (!_.isNil(instruction)) {
        for (let i = 0; i < configKeys.length; i++) {
          if (instruction[1] === configKeys[i]) {
            if (!_.isNil(configDocument[instruction[1]].Template)) {
              found++;
            }
          }
        }
      }
    }
    if (found >= 1) {
      return true;
    }
  }
  return false;
}

let compileLine = (line, configKeys, configDocument, warnings, warningsCntr, lineCntr) => {
  if (line.match(regexUuidv4)) {
    regexUuidv4.lastIndex = 0;
    let matched = regexUuidv4.exec(line);
    let matchedInstruction = matched[0];
    console.log(`Inserting uuidv4() on line ${lineCntr}`);
    return compileLine(line.replace(matchedInstruction, uuidv4()), configKeys, configDocument, warnings, warningsCntr, lineCntr);
  }
  if (line.match(regexRandomString)) {
    regexRandomString.lastIndex = 0;
    let matched = regexRandomString.exec(line);
    let matchedInstruction = matched[0];
    let length = parseInt(matched[1]);
    console.log(`Inserting randomString() of length ${length} on line ${lineCntr}`);
    return compileLine(line.replace(matchedInstruction, randomString(length)), configKeys, configDocument, warnings, warningsCntr, lineCntr);
  }
  if (line.match(regexTimestamp)) {
    regexTimestamp.lastIndex = 0;
    let matched = regexTimestamp.exec(line);
    let matchedInstruction = matched[0];
    let length = parseInt(matched[1]);
    console.log(`Inserting current timestamp on line ${lineCntr}`);
    return compileLine(line.replace(matchedInstruction, Math.floor(new Date() / 1000)), configKeys, configDocument, warnings, warningsCntr, lineCntr);
  }
  if (line.match(regexDefault)) {
    regexDefault.lastIndex = 0;
    let matched = regexDefault.exec(line);
    let matchedInstruction = matched[0];
    let matchedInstructionWithoutTag = matched[1];
    let found = false;
    configKeys.forEach((key) => {
      if (key === matchedInstructionWithoutTag) {
        found = true;
      }
    });

    try {
      configDocument[matchedInstructionWithoutTag].Value;
    } catch (exception) {
      // return line if configured tag does not exist
      console.log(`[WARNING] Unkown instruction ${matchedInstructionWithoutTag} on line ${lineCntr}`);
      warnings.push(`[WARNING] Unkown instruction ${matchedInstructionWithoutTag} on line ${lineCntr}`);
      warningsCntr++;

      return line;
    }

    if (!_.isNil(configDocument[matchedInstructionWithoutTag].Value)) {
      console.log(`Inserting value defined under ${matchedInstructionWithoutTag} on line ${lineCntr}`);
      return compileLine(line.replace(matchedInstruction, configDocument[matchedInstructionWithoutTag].Value), configKeys, configDocument, warnings, warningsCntr, lineCntr);
    } else if (!_.isNil(configDocument[matchedInstructionWithoutTag].Template)) {
      console.log(`Inserting template defined under ${matchedInstructionWithoutTag} on line ${lineCntr}`);

      let ident = detectIndent(line.toString("utf-8")).indent;
      let snippetLiner = new lineByLine(configDocument[matchedInstructionWithoutTag].Template);
      let snippetLine;

      line = [];

      while (snippetLine = snippetLiner.next()) {
        line.push(`${ ident }${ snippetLine.toString("utf-8") }`);
      }

      return line;
    } else {
      console.log(`[WARNING] Unkown instruction type ${configDocument[matchedInstructionWithoutTag]} for ${ instruction }`);
      warnings.push(`[WARNING] Unkown instruction type ${configDocument[matchedInstructionWithoutTag]} for ${ instruction }`);
      warningsCntr++;
    }
  }
  return line;
};

let compile = (source, target, config) => {
  try {
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
    let lineCntr = 0;
    let liner = new lineByLine(source);
    let line;

    while (line = liner.next()) {
      lineCntr++;
      let currentLine = line.toString("utf-8");
      let tmpLine = Object.assign(currentLine);

      if (!checkTemplates(tmpLine, configKeys, configDocument)) {
        tmpLine = compileLine(tmpLine, configKeys, configDocument, warnings, warningsCntr, lineCntr);
      } else {
        console.log(`[WARNING] Line: ${lineCntr} Template instructions are not allowed in one line with other instructions!`);
        warnings.push(`[WARNING] Line: ${lineCntr} Template instructions are not allowed in one line with other instructions!`);
        warningsCntr++;
      }

      if (tmpLine === currentLine) {
        fs.appendFileSync(target, `${ currentLine }\n`);
      } else if (tmpLine instanceof Array) {
        tmpLine.forEach(line => {
          fs.appendFileSync(target, `${ line }\n`);
        });
      } else {
        fs.appendFileSync(target, `${ tmpLine }\n`);
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

module.exports = {
  compile,
  compileLine,
  checkTemplates
}