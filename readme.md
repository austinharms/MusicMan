# Music Man
## Formerly UtilityBot

## Requirements
Runs in NodeJS version 16 or latter

## Environment Variables
`CLIENT_TOKENS` The tokens for "Channel" bots, the first token with be the main client. Can add multiple tokens separated by a comma **NO SPACE**, get from the discord developer portal

`CMD_PREFIX` The prefix all commands must start with  

`YT_COOKIE` The cookies sent when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the cookies header  

`YT_ID` The user id used when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the x-youtube-identity-token header  

### Example
```
CHANNEL_TOKENS="1234567890,1234567890,1234567890"
YT_COOKIE="COOKIES"
YT_ID="1234567890"
CMD_PREFIX="~"
```