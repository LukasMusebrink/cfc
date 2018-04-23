# CFC - AWS CloudFormation Compiler
#### currently only YAML is supported

## Installation
```sh
$ npm install cfc -g
```

## Usage
### Exemplary Project Structure
![project structure](https://github.com/LukasMusebrink/cfc/raw/master/samples/img/folder.png "Logo Title Text 1")

### Configuration
```yaml
SnippetA:
  Template: snippet-a.yaml
SnippetB:
  Template: snippet-a.yaml
ValueA:
  Value: MyStaticValue
```


### Executing
```sh
$ cfc --source source.yaml --config config.yaml --target build/target.yaml
```
