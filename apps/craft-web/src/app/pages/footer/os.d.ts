declare module 'os' {
  export function cpus(): { times: { user: number; nice: number; sys: number; idle: number; irq: number } }[];
}
