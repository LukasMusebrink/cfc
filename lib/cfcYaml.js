const fs = require("fs");
const path = require("path");

const yaml = require("js-yaml");
const detectIndent = require("detect-indent");
const lineByLine = require("n-readlines");
const moment = require("moment");
const _ = require("lodash");

const cfcIdentifier = "!CFC";
const regexTag = /!CFC\s*(\S+)/g;

let compile = (source, target, config) => {
  try {
    let before = new Date();
    let configDocument = yaml.safeLoad(fs.readFileSync(config, "utf8"));
    let configKeys = Object.keys(configDocument);

    let dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      console.log(`Creating ${ dir } since the selected target directory ${ dir } does not exist.`);
      fs.mkdirSync(dir);
    }else{
      try{
        fs.unlinkSync(target);
      }catch(err) {
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
      if(line.includes(cfcIdentifier)) {
        console.log(`Found cfc instruction on line ${ cntr }: ${ line.toString("utf-8").trim() }`);
        let matchedInstruction = line.toString("utf-8").match(regexTag)[0];
        let instruction = matchedInstruction.replace(cfcIdentifier, "").trim();

        let found = false;
        configKeys.forEach((key) => {
          if(key === instruction) {
            found = true;
          }
        });
        if(found) {
          console.log(`Inserting ${ instruction } on line ${ cntr }`);

          if(!_.isNil(configDocument[instruction].Template)) {
            let ident = detectIndent(line.toString("utf-8")).indent;
            let snippetLiner = new lineByLine(configDocument[instruction].Template);
            let snippetLine;

            while (snippetLine = snippetLiner.next()) {
              fs.appendFileSync(target, `${ ident }${ snippetLine.toString("utf-8") }\n`);
            }

          }else if(!_.isNil(configDocument[instruction].Value)) {
            fs.appendFileSync(target, `${ line.toString("utf-8").replace(matchedInstruction, configDocument[instruction].Value) }\n`);
          }else{
            console.log(`[WARNING] Unkown instruction type for ${ instruction }`);
            warnings.push(`[WARNING] Unkown instruction type for ${ instruction }`);
            warningsCntr++;
          }

          console.log(`Done inserting ${ instruction } starting on line ${ cntr }`);

        }else{
          console.log(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warnings.push(`[WARNING] Defined instruction ${ instruction } not found in configuration`);
          warningsCntr++;
        }
      }else{

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
