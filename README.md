# Discord DM leaver

This simple script allows you to automatically leave all your DMs.

## Requirements

For this script you require `node.js` (at least version 18) and `yarn`.

## Installation

To install all dependencies, run following command in the directory of the script: `yarn`. All dependencies should not be installed.

## Running without config

If you simply want to run this script once, you can run `yarn start` in the directory of the script. You will be prompted to enter the some names or IDs of DM channels you do not whish to leave.  
After that you need to press return once more, after that you need to enter your discord token ([how to obtain my Discord token](https://linuxhint.com/get-discord-token/)).

Your channels will now be left automatically.

## Running with config

A config can be provided for easier automation of the execution of this script. Simply pass the config by specifying `--config "CONFIG PATH"` when running the script. An example config can be found here [example config](/example-config.json)