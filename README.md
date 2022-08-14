# Music Man
#### A discord.js based Music Bot
Can play youtube videos(sound only) in discord voice channels, and supports multiple bots at the same time!

### Requirements
- Node.js version 16 or later

## Getting Started
Create a `config.json` base on `config.son.sample`  
- `dev(boolean)`: log all errors to console and only update `discord.devGuildId` slash commands
- `discord`
    * `bots(array)`: an array of discord bots to use
        * `token`: the token for the discord bot (used to login)
        * `clientId`: the discord application clientId (used to update slash commands)
    * `devGuildId`: used to only update a guild slash command when `dev` is `true`
- `yt`: youtube request settings
    * `headers`: headers to send when requesting yt videos
        * `cookie`: The cookies sent when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the cookies header  
        * `x-youtube-identity-token`: The user id used when getting a video, Required for restricted videos, can be found in the network tab in a web browser when loading a video under the x-youtube-identity-token  
        
Run `npm run build` to build a js version of the app in the `build` dir  
Run `npm run start` to run Music Man!  
***Note**: you can also use `npm run dev` to run the bot using ts-node for type checking*
