# Music Man
## Formerly UtilityBot

## Requirements
Runs in NodeJS version 16 or latter

## Environment Variables
`MAIN_TOKEN` The token for the master bot account, get from the discord developer portal 

`CHANNEL_TOKENS` The tokens for slave "Channel" bots. Can add multiple tokens separated by a comma **NO SPACE**, get from the discord developer portal

`CMD_PREFIX` The prefix all commands must start with  

`LOG_MODE` The way in witch it logs errors
Options
* `ERROR` Log only Real Errors (Not User Errors, DEFAULT)
* `ALL` Log all Errors
* `NONE` Log Nothing  

`ADMINS` The userId of people who are allowed to view error logs, Can add id's separated by a comma **NO SPACE**  

`YT_COOKIE` The cookies sent when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the cookies header  

`YT_ID` The user id used when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the x-youtube-identity-token header  