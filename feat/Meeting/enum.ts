export enum LiveKitConfig {
  TabsPushMethod = 'replace',
  StorageKeyTab = 'rf-tab',
}

export enum ConnectionInterceptor {
  Unknown = 'unknown',
  Blocked = 'blocked',
  Waiting = 'waiting',
  Limit = 'limit',
}

export enum ConnectionSearch {
  Tabs = 'tab',
  TabsState = 'io',
}
