export enum LiveKitAction {
  WhiteboardRequest = 'WHITEBOARD_REQUEST',
  WhiteboardClose = 'WHITEBOARD_CLOSE',
  WhiteboardUpdate = 'WHITEBOARD_UPDATE',
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
  Whiteboard = 1,
  Presentation = 2,
  WatchYoutube = 3,
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
