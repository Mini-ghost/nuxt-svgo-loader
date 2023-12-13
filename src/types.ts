export interface SvgFilesInfo {
  path: string
  filePath: string
  name: string
  size: number
  mtime: number
}

export interface ServerFunctions {
  getStaticSvgFiles(): Promise<SvgFilesInfo[]>
}

export interface ClientFunctions {
  refresh(event: ClientUpdateEvent): void
}

export type ClientUpdateEvent = keyof ServerFunctions
