# Music Man
#### A discord.js based Music Bot
Can play YouTube videos(sound only) in discord voice channels, and supports multiple bots at the same time!

### Requirements
- Node.js version 16 or later

## Getting Started
Create a `config.json` base on `config.json.sample`  
- `dev{boolean}`: log all errors to console and only update `discord.devGuildId` slash commands
- `discord{object}`
    * `bots{array}`: an array of discord bots to use
        * `token{string}`: the token for the discord bot (used to login)
        * `clientId{string}`: the discord application clientId (used to update slash commands)
    * `devGuildId{string}`: used to only update a guild slash command when `dev` is `true`
- `yt{object}`: youtube request settings
    * `headers{object}`: headers to send when requesting yt videos
        * `cookie{string}`: The cookies sent when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the cookies header  
        * `x-youtube-identity-token{string}`: The user id used when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the x-youtube-identity-token  

Run `npm install` to install dependencies  
Run `npm run build`* to build a js version of the app in the `build` dir  
Run `npm run start` to run Music Man!  
You can also use `npm run dev`* to run the Music Man using `ts-node` for added type checking  
***Note:** Commands marked with \* are not available in builds*
