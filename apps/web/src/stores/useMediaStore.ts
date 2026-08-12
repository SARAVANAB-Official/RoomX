import { create } from 'zustand';

interface MediaState {
  micOn: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  screenStream: MediaStream | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isSpeaking: boolean;
  handRaised: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  startScreenShare: (stream: MediaStream) => void;
  stopScreenShare: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (userId: string, stream: MediaStream) => void;
  removeRemoteStream: (userId: string) => void;
  setSpeaking: (speaking: boolean) => void;
  toggleHand: () => void;
  setMicOn: (on: boolean) => void;
  setCameraOn: (on: boolean) => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  micOn: false,
  cameraOn: false,
  screenSharing: false,
  screenStream: null,
  localStream: null,
  remoteStreams: new Map(),
  isSpeaking: false,
  handRaised: false,

  toggleMic: () => set((state) => {
    const newMicOn = !state.micOn;
    if (state.localStream) {
      state.localStream.getAudioTracks().forEach((t) => { t.enabled = newMicOn; });
    }
    return { micOn: newMicOn };
  }),

  toggleCamera: () => set((state) => {
    const newCameraOn = !state.cameraOn;
    if (state.localStream) {
      state.localStream.getVideoTracks().forEach((t) => { t.enabled = newCameraOn; });
    }
    return { cameraOn: newCameraOn };
  }),

  startScreenShare: (stream) =>
    set({ screenSharing: true, screenStream: stream }),

  stopScreenShare: () =>
    set((state) => {
      state.screenStream?.getTracks().forEach((t) => t.stop());
      return { screenSharing: false, screenStream: null };
    }),

  setLocalStream: (stream) => set({ localStream: stream }),

  addRemoteStream: (userId, stream) =>
    set((state) => {
      const next = new Map(state.remoteStreams);
      next.set(userId, stream);
      return { remoteStreams: next };
    }),

  removeRemoteStream: (userId) =>
    set((state) => {
      const next = new Map(state.remoteStreams);
      const stream = next.get(userId);
      stream?.getTracks().forEach((t) => t.stop());
      next.delete(userId);
      return { remoteStreams: next };
    }),

  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  toggleHand: () => set((state) => ({ handRaised: !state.handRaised })),

  setMicOn: (on) => set({ micOn: on }),

  setCameraOn: (on) => set({ cameraOn: on }),
}));
