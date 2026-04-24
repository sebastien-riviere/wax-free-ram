declare module '@waxio/waxjs' {
  interface WaxJSOptions {
    rpcEndpoint: string
    tryAutoLogin?: boolean
    userAccount?: string
    pubKeys?: string[]
  }

  class WaxJS {
    constructor(options: WaxJSOptions)
    login(): Promise<string>
    isAutoLoginAvailable(): Promise<boolean>
    api: unknown
  }

  export default WaxJS
}

declare module 'anchor-link' {
  interface Chain {
    chainId: string
    nodeUrl: string
  }
  interface AnchorLinkOptions {
    transport: unknown
    chains: Chain[]
  }
  interface Session {
    auth: { actor: { toString(): string } }
  }
  interface LoginResult {
    session: Session
  }
  class AnchorLink {
    constructor(options: AnchorLinkOptions)
    login(identifier: string): Promise<LoginResult>
  }
  export default AnchorLink
}

declare module 'anchor-link-browser-transport' {
  class AnchorLinkBrowserTransport {
    constructor()
  }
  export default AnchorLinkBrowserTransport
}
