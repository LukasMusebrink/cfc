# CFC - AWS CloudFormation Compiler
[![DavidDM](https://david-dm.org/LukasMusebrink/cfc.svg)](https://david-dm.org/LukasMusebrink/cfc.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/LukasMusebrink/cfc/badge.svg)](https://snyk.io/test/github/LukasMusebrink/cfc)

[![NPM](https://nodei.co/npm/cfc.png?compact=true)](https://nodei.co/npm/cfc/)

*Please note: currently only YAML is supported*
## Description
CFC - CloudFormation Compiler - A simple tool that helps you "compile" static variables or snippets in your AWS CloudFormation template.

## Motivation
When you start working frequently with AWS CloudFormation you often come up against limits. One of these limits is the handling of reusable components.  For example, if you want to define several EC2 instances with the same user data script, and if you want to maintain this script only on one place and not per EC2 instance. Or if you want to use static variables in a CloudFormation template at several places.

This project tries to offer a solution for exactly these problems.


## Installation
```sh
$ npm install cfc -g
```

## Usage
### Execution
```sh
$ cfc --source source.yaml --config config.yaml --target build/target.yaml
```
- --source [PATH] path to source template
- --config [PATH] path to configuration file
- --target [PATH] path to the target file

### Example
You can find a detailed example in the samples folder of this repository.
![CFC Sample](https://itonaut.com/wp-content/uploads/2018/04/cfc_sample_1.0.0.gif)

#### Configuration
The configuration is described in yaml. You can define a "Template" or a "Value".

- Template: path to a snippet
- Value: value to be inserted

For Templates: Please make sure that the file paths are accessible from the execution location.


```yaml
SnippetA:
  Template: snippet-a.yaml
ValueA:
  Value: MyStaticValue
```

#### Source template
Reference defined "Values" or "Templates" using:
- !CFC [Name-Used-In-Configuration]

Furthermore you have the possibility to use functions inside your source template.

- !CFC uuidv4()
  - uuidv4 (random) e.g.: *416ac246-e7ac-49ff-93b4-f7e94d997e6b*
- !CFC randomString(length)
 - generates a random alphanumeric string of a given length
- !CFC timestamp()
  - current timestamp e.g.: *Thu Apr 26 2018 22:29:56 GMT+0200 (CEST)*

```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: A sample template

Resources:
  SampleEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-c481fad3
      InstanceType: t2.nano
      KeyName: !CFC ValueA
      BlockDeviceMappings:
        -
          DeviceName: /dev/sdm
          Ebs:
            VolumeType: gp2
            VolumeSize: 10
      UserData:
        !CFC SnippetA
    Tags:
      - Key: Name
        Value: !CFC uuidv4()
      - Key: Timestamp
        Value: !CFC  timestamp()
      - Key: RandomString
        Value: !CFC randomString(10)
```
## Contribute
Feel free to contribute ;)
