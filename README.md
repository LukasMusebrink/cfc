# CFC - AWS CloudFormation Compiler
- https://coveralls.io/sign-up
- https://snyk.io/
- https://travis-ci.org/

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
Reference defined "Values" or "Templates" using *!CFC [Name-Used-In-Configuration]*

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
```
## Contribute
Feel free to contribute ;)
