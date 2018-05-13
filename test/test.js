const expect = require('chai').expect;
const yaml = require("js-yaml");
const fs = require("fs");
const path = require('path')
const {
  compile,
  compileLine,
  checkTemplates
} = require('../lib/yaml');
const {
  randomString
} = require('../lib/utils');


describe('compileLine()', function() {
  it('it should compiles a defined line', function() {
    let sampleLine1 = "        Value: !CFC  timestamp()";
    let sampleLine2 = "        Value: !CFC randomString(10)";
    let sampleLine3 = "        Value: !CFC uuidv4() !CFC randomString(10)";
    let sampleLine4 = "      KeyName: !CFC ValueA";
    let sampleLine5 = "      KeyName: !CFC ValueB"; // not existing value

    let configDocument = yaml.safeLoad(fs.readFileSync("test/data/config.yaml", "utf8"));
    let configKeys = Object.keys(configDocument);

    let result1 = compileLine(sampleLine1, configKeys, configDocument, [], 0, 0);
    let result2 = compileLine(sampleLine2, configKeys, configDocument, [], 0, 0);
    let result3 = compileLine(sampleLine3, configKeys, configDocument, [], 0, 0);
    let result4 = compileLine(sampleLine4, configKeys, configDocument, [], 0, 0);
    let result5 = compileLine(sampleLine5, configKeys, configDocument, [], 0, 0)

    // expect(result1).to.match();
    expect(result2).to.match(/        Value: .{10,10}/);
    // expect(result3).to.match();
    expect(result4).to.equal("      KeyName: MyStaticValue");
    expect(result5).to.equal("      KeyName: !CFC ValueB");

  });
});


describe('checkTemplates()', function() {
  it('it should check a line for templates and if they are used properly', function() {
    let sampleLine1 = "!CFC timestamp() !CFC SnippetB";
    let sampleLine2 = "!CFC SnippetA";
    let sampleLine3 = "!CFC timestamp() !CFC uuidv4()";

    let configDocument = yaml.safeLoad(fs.readFileSync("test/data/config.yaml", "utf8"));
    let configKeys = Object.keys(configDocument);

    let result1 = checkTemplates(sampleLine1, configKeys, configDocument);
    let result2 = checkTemplates(sampleLine2, configKeys, configDocument);
    let result3 = checkTemplates(sampleLine3, configKeys, configDocument);

    expect(result1).to.equal(true);
    expect(result2).to.equal(false);
    expect(result3).to.equal(false);

  });
});

describe('randomString()', function() {
  it('it should generate a random string', function() {
    let randomString1 = randomString(1);
    let randomString2 = randomString(2);
    let randomString3 = randomString(3);
    let randomString4 = randomString(4);
    let randomString5 = randomString(5);
    let randomString6 = randomString(6);
    let randomString7 = randomString(7);
    let randomString8 = randomString(8);
    let randomString9 = randomString(9);
    let randomString10 = randomString(10);
    let randomString11 = randomString(11);

    expect(randomString1).to.have.lengthOf(1);
    expect(randomString2).to.have.lengthOf(2);
    expect(randomString3).to.have.lengthOf(3);
    expect(randomString4).to.have.lengthOf(4);
    expect(randomString5).to.have.lengthOf(5);
    expect(randomString6).to.have.lengthOf(6);
    expect(randomString7).to.have.lengthOf(7);
    expect(randomString8).to.have.lengthOf(8);
    expect(randomString9).to.have.lengthOf(9);
    expect(randomString10).to.have.lengthOf(10);
    expect(randomString11).to.have.lengthOf(11);
  });
});