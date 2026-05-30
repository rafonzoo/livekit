export enum LiveKitAction {
  SnapshotRequest = 'SNAPSHOT_REQUEST',
  SnapshotReply = 'SNAPSHOT_REPLY',
  // WhiteboardRequest = 'WHITEBOARD_REQUEST',
  // WhiteboardClose = 'WHITEBOARD_CLOSE',
  WhiteboardUpdate = 'WHITEBOARD_UPDATE',
  YoutubeUpdate = 'YOUTUBE_UPDATE',
}

export enum ParticipantAttribute {
  ScreenRecord = 'SCREEN_RECORD',
  ScreenActive = 'SCREEN_ACTIVE',
  ScreenActiveHost = 'SCREEN_ACTIVE_HOST',
  ScreenActiveUrl = 'SCREEN_ACTIVE_URL',
}

export enum ConnectionInterceptor {
  Unknown = 'unknown',
  Blocked = 'blocked',
  Waiting = 'waiting',
  Limit = 'limit',
}

export enum SearchParamsKey {
  TabsCode = 'tc',
  PanelCode = 'pc',
  ScreenCode = 'sc',
}

export enum PanelCode {
  Open = 1,
  SideOpen = 2,
}

export enum ScreenCode {
  Recording = 1,
  Whiteboard = 2,
  Presentation = 3,
  WatchYoutube = 4,
}

export enum TabsCode {
  TabsMeeting = 1,
  TabsMeetingSharedNotes = 11,
  TabsMeetingPolling = 12,
  TabsMeetingWatchYoutube = 13,
  TabsParticipant = 2,
  TabsChats = 3,
  TabsPersonalize = 4,
  TabsSettings = 5,
}

export enum GroupsCode {
  Collaboration = 1,
  Content = 2,
  Media = 3,
  Admin = 4,
}

export enum GroupCode {
  ShareNote = 1,
  Polling = 2,
  Whiteboard = 3,
  Presentation = 4,
  WatchYoutube = 5,
  Recording = 6,
  PickRandom = 7,
}
