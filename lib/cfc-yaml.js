const yaml = require('js-yaml');
const fs   = require('fs');
const readline = require('readline');

const cfcIdentifier = "!CFC";

let compile = function(source, target, config){
  try {
    let configDocument = yaml.safeLoad(fs.readFileSync(config, 'utf8'));
    let configKeys = Object.keys(configDocument);

    let rd = readline.createInterface({
      input: fs.createReadStream(source),
      console: false
    });
    let cntr = 0;
    rd.on('line', function(line) {
      cntr++;
      if(line.includes(cfcIdentifier)) {
        console.log(`Found cfc instruction on line ${cntr}: ${line.trim()}`)
        let instruction = line.replace(cfcIdentifier, "");
        instruction = instruction.trim();
        let found = false;
        let foundKey;
        configKeys.forEach(key=>{
          if(key===instruction){
            found = true;
            foundKey=key;
          }
        });
        if(found){
          console.log(`Inserting ${configDocument[foundKey]} on line ${cntr}`);
          let document = fs.readFileSync(configDocument[foundKey], 'utf-8');
          fs.appendFileSync(target, document);

        }else{
          console.log(`[WARNING] Defined instruction ${instruction} not found in configuration`);
        }
      }else{
        fs.appendFileSync(target, line);
      }
    });


  } catch (err) {
    console.log(`Error while compiling YAML: ${err.stack}`);
  }

}

exports.compile = compile;
