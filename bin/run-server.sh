#!/bin/bash -e

CONFIG_PATH="../config.json"
JAR_FILE=bluewave.jar

cp ./build/libs/${JAR_FILE} .

unzip -o -q ${JAR_FILE}

java bluewave.Main -config ${CONFIG_PATH}
