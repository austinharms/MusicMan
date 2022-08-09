export type CommandName = string;

export interface Command {
  name: CommandName,
  description: string,
  run: (params:any) => void,
};