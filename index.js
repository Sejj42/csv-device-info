const fs = require('fs');
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const ObjectsToCsv = require('objects-to-csv');
const path = require('path');

const csvPath = './assets/devices.csv';
const unicode = 'utf8';

const noDoubleQuotesValidator = string => {
  if (string === undefined || string === null) {
    return null;
  }
  if (string[0] === '"') {
    string = string.substring(1, string.length);
  }
  if (string[string.length - 1] === '"') {
    string = string.substring(0, string.length - 1);
  }
  return string;
};
const userAgentValidator = entry => {
  let userAgentOutput = '';
  for (let i = 3; i < entry.length; i++) {
    if (i !== entry.length - 1) {
      userAgentOutput += noDoubleQuotesValidator(entry[i]) + ',';
    }
    if (i === entry.length - 1) {
      userAgentOutput += noDoubleQuotesValidator(entry[i]);
    }
  }
  return userAgentOutput;
};

const nullChecker = input => {
  if (input == null || input == undefined || input == '') {
    return 'N/A';
  } else {
    return input;
  }
};

const gettingDataFromCsv = (csvPath, unicode) => {
  let csvDataArray = [];

  let data = fs.readFileSync(csvPath, unicode);
  data = data.split('\r\n');
  for (let i = 1; i < data.length; i++) {
    if (data[i] !== '') {
      csvDataArray.push(data[i]);
    }
  }
  return csvDataArray;
};

const formattingTheDataArray = csvDataArray => {
  let formattedDataArray = csvDataArray.map(entry => {
    entry = entry.split(',');
    return {
      id: noDoubleQuotesValidator(entry[0]),
      name: noDoubleQuotesValidator(entry[1]),
      mac: noDoubleQuotesValidator(entry[2]),
      userAgent: userAgentValidator(entry),
      brand: '',
      family: '',
      type: '',
    };
  });
  return formattedDataArray;
};

const getApiDataArray = async formattedDataArray => {
  const apiDataArray = formattedDataArray.map(async device => {
    const res = await axios.get(
      `http://api.userstack.com/detect?access_key=${process.env.USERSTACK_API_ACCESS_KEY}&ua=${device.userAgent}`,
    );
    const data = res.data;
    return {
      userAgent: device.userAgent,
      brand: nullChecker(data.brand),
      family: nullChecker(data.os.family),
      type: nullChecker(data.device.type),
    };
  });
  const results = await Promise.all(apiDataArray);
  return results;
};

const updateTheFormattedDataArray = (formattedDataArray, apiDataArray) => {
  let updatedFormattedArray = [];
  formattedDataArray.forEach(device => {
    apiDataArray.forEach(apiDevice => {
      if (device.userAgent === apiDevice.userAgent) {
        return updatedFormattedArray.push({
          id: device.id,
          name: device.name,
          mac: device.mac,
          userAgent: device.userAgent,
          brand: nullChecker(apiDevice.brand),
          family: nullChecker(apiDevice.family),
          type: nullChecker(apiDevice.type),
        });
      }
    });
  });
  return updatedFormattedArray;
};

const writeToCsvFile = async updatedFormattedArray => {
  const csv = new ObjectsToCsv(updatedFormattedArray);
  await csv.toDisk(csvPath);
};

const writeToDb = async updatedFormattedArray => {
  let db = new sqlite3.Database('./db/chinook.db', sqlite3.OPEN_READWRITE, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite DB.');
  });

  db.serialize(() => {
    updatedFormattedArray.forEach(entry => {
      if (entry.id !== '' || entry.name !== null || entry.id !== undefined) {
        db.run(
          `CREATE TABLE if not exists devices(id CHAR, name CHAR, mac CHAR, user_agent CHAR, brand CHAR, family CHAR, type CHAR)`,
        );
        db.run(
          `INSERT INTO devices(id, name, mac, user_agent, brand, family, type) VALUES(${'"' + entry.id + '"'}, ${
            '"' + entry.name + '"'
          }, ${'"' + entry.mac + '"'}, ${'"' + entry.userAgent + '"'}, ${'"' + entry.brand + '"'}, ${
            '"' + entry.family + '"'
          }, ${'"' + entry.type + '"'});`,
        );
      }
    });
  });

  db.close(err => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed the DB connection.');
  });
};
const theFunc = async (csvPath, unicode) => {
  const csvDataArray = gettingDataFromCsv(csvPath, unicode);
  const formattedDataArray = formattingTheDataArray(csvDataArray);
  const apiDataArray = await getApiDataArray(formattedDataArray);
  const updatedFormattedArray = updateTheFormattedDataArray(formattedDataArray, apiDataArray);
  await writeToCsvFile(updatedFormattedArray);
  await writeToDb(updatedFormattedArray);
};

theFunc(csvPath, unicode);
