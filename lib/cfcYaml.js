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
const regexTag = /!CFC\s*(\S+)/g;
const regexDefault = /!CFC\s*(.*)/g;

let checkTemplates = (line, configKeys, configDocument) => {
  let matched = line.match(regexTag);
  if (!_.isNil(matched)) {
    if (matched.length <= 1) {
      return false;
    }
    for (let j = 0; j <= matched.length; j++) {
      let instruction = regexTag.exec(matched[j]);
      console.log(line + "-" + JSON.stringify(instruction));
      for (let i = 0; i <= configKeys.length; i++) {
        if (instruction[0] === configKeys[i]) {
          if (!_.isNil(configDocument[instruction[0]].Template)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

let compileLine = (line, configKeys, configDocument, warnings, warningsCntr) => {
  if (line.match(regexUuidv4)) {
    let matched = regexUuidv4.exec(line);
    let matchedInstruction = matched[0];
    return compileLine(line.replace(matchedInstruction, uuidv4()));
  }
  if (line.match(regexRandomString)) {
    let matched = regexRandomString.exec(line);
    let matchedInstruction = matched[0];
    let length = parseInt(matched[1]);
    return compileLine(line.replace(matchedInstruction, randomString(length)));
  }
  if (line.match(regexTimestamp)) {
    let matched = regexTimestamp.exec(line);
    let matchedInstruction = matched[0];
    let length = parseInt(matched[1]);
    return compileLine(line.replace(matchedInstruction, new Date()));
  }
  if (line.match(regexDefault)) {
    let matched = regexDefault.exec(line);
    let matchedInstruction = matched[0];
    let matchedInstructionWithoutTag = matched[1];
    let found = false;
    configKeys.forEach((key) => {
      if (key === matchedInstructionWithoutTag) {
        found = true;
      }
    });
    if (!_.isNil(configDocument[matchedInstructionWithoutTag].Value)) {
      return compileLine(line.replace(matchedInstruction, configDocument[matchedInstructionWithoutTag].Value));
    } else if (!_.isNil(configDocument[matchedInstructionWithoutTag].Template)) {
      return compileLine(line.replace(matchedInstruction, configDocument[matchedInstructionWithoutTag].Template));
    } else {
      console.log(`[WARNING] Unkown instruction type ${configDocument[matchedInstructionWithoutTag]} for ${ instruction }`);
      warnings.push(`[WARNING] Unkown instruction type ${configDocument[matchedInstructionWithoutTag]} for ${ instruction }`);
      warningsCntr++;
    }
    // if template echo warning
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
        tmpLine = compileLine(tmpLine, configKeys, configDocument, warnings, warningsCntr);
      } else {
        console.log(`[WARNING] Line: ${lineCntr} Template instructions are not allowed in one line with other instructions!`);
        warnings.push(`[WARNING] Line: ${lineCntr} Template instructions are not allowed in one line with other instructions!`);
        warningsCntr++;
      }

      if (tmpLine === currentLine) {
        fs.appendFileSync(target, `${ currentLine }\n`);
      } else {
        fs.appendFileSync(target, `${ tmpLine }\n`);
      }

      // old
      /*
      if (line.includes(cfcIdentifier)) {
        console.log(`Found cfc instruction on line ${ lineCntr }: ${ currentLine.trim() }`);
        let matchedInstruction = currentLine.match(regexTag)[0];
        let instruction = matchedInstruction.replace(cfcIdentifier, "").trim();

        let found = false;
        configKeys.forEach((key) => {
          if (key === instruction) {
            found = true;
          }
        });
        if (found) {
          console.log(`Inserting ${ instruction } on line ${ lineCntr }`);

          if (!_.isNil(configDocument[instruction].Template)) {
            let ident = detectIndent(currentLine).indent;
            let snippetLiner = new lineByLine(configDocument[instruction].Template);
            let snippetLine;

            while (snippetLine = snippetLiner.next()) {
              fs.appendFileSync(target, `${ ident }${ snippetLine }\n`);
            }

          } else if (!_.isNil(configDocument[instruction].Value)) {
            fs.appendFileSync(target, `${ currentLine.replace(matchedInstruction, configDocument[instruction].Value) }\n`);
          } else {
            console.log(`[WARNING] Unkown instruction type for ${ instruction }`);
            warnings.push(`[WARNING] Unkown instruction type for ${ instruction }`);
            warningsCntr++;
          }

          console.log(`Done inserting ${ instruction } starting on line ${ lineCntr }`);

        } else {
          console.log(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warnings.push(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warningsCntr++;
        }
      } else {

        fs.appendFileSync(target, `${ line }\n`);
      }*/


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