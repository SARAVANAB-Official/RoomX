export interface MediaState {
  micOn: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  isSpeaking: boolean;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'candidate' | 'renegotiate' | 'ice';
  from: string;
  to: string;
  roomId: string;
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
  timestamp: Date;
}

export interface ICECandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment?: string;
}