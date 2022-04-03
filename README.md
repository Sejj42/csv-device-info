# csv-device-info

## This script was made with care, love and Javascript.

## What does this script do?
(1) This script takes in device data from a given csv.
(2) sends a request to an external API to receive additional information per device
(3) saves all data per device to the 'chinook' (cool name for the local db) SQLite db
(4) updates the original csv with additional columns of the additional information received from the external API.

### Prerequisites
(1) Nodejs installed on your machine
(2) An active account on Userstack.com (the external API) to be able to send API requests.

### Instructions
(1) 'npm install' to install all dependencies (all dependencies are listed in the package.json)
(2) fill in your Userstack.com's USERSTACK_API_ACCESS_KEY in the .env file
(3) type in the CLI 'node index' to execute the script

### Extras
(1) If wanting to use new csv files, simply add them to the assets directory and change the csvPath variable to match the new file's name
(2) 

