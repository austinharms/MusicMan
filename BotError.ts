import { config } from "./configuration";

export class BotError extends Error {
    userMessage: string;
  
    constructor(message: string | Error, userMessage?: string) {
      if (message instanceof Error) {
        super(message.message);
        this.stack = message.stack;
      } else {
        super(message);
      }
  
      this.name = "BotError";
      this.userMessage = userMessage || "There was an Error";
      if (config.dev) console.error(this);
    }
  }