export interface Command {
  name: string,
  description: string,
  run: (params:any) => void,
};