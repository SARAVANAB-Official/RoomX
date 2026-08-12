import { useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useMediaStore } from '@/stores/useMediaStore';
import { useRoomStore } from '@/stores/useRoomStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface PeerStatus {
  [userId: string]: 'new' | 'checking' | 'connected' | 'completed' | 'failed' | 'disconnected' | 'closed';
}

interface UseWebRTCReturn {
  getLocalMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream | null>;
  createPeerConnection: (userId: string, socket: Socket) => RTCPeerConnection;
  createOffer: (userId: string, socket: Socket, roomId: string) => Promise<void>;
  createAnswer: (userId: string, offer: RTCSessionDescriptionInit, socket: Socket, roomId: string) => Promise<void>;
  handleICECandidate: (userId: string, candidate: RTCIceCandidateInit, socket: Socket, roomId: string) => void;
  startScreenShare: (socket: Socket, roomId: string) => Promise<MediaStream | null>;
  stopScreenShare: (socket: Socket, roomId: string) => void;
  cleanup: () => void;
  peerStatus: PeerStatus;
}

export function useWebRTC(): UseWebRTCReturn {
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [peerStatus, setPeerStatus] = useState<PeerStatus>({});

  const updatePeerStatus = (userId: string, status: PeerStatus[string]) => {
    setPeerStatus((prev) => ({ ...prev, [userId]: status }));
  };

  const getLocalMedia = useCallback(async (constraints?: MediaStreamConstraints): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || { audio: true, video: true }
      );
      useMediaStore.getState().setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local media:', err);
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((userId: string, socket: Socket): RTCPeerConnection => {
    const existing = peerConnections.current.get(userId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(userId, pc);
    updatePeerStatus(userId, 'new');

    const localStream = useMediaStore.getState().localStream;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        useMediaStore.getState().addRemoteStream(userId, stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const roomId = useRoomStore.getState().currentRoom?.id;
        if (roomId) {
          socket.emit('webrtc:signal', {
            type: 'candidate',
            to: userId,
            roomId,
            payload: event.candidate.toJSON(),
          });
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        updatePeerStatus(userId, 'connected');
      } else if (state === 'failed') {
        updatePeerStatus(userId, 'failed');
      } else if (state === 'disconnected') {
        updatePeerStatus(userId, 'disconnected');
      } else if (state === 'checking') {
        updatePeerStatus(userId, 'checking');
      }
    };

    return pc;
  }, []);

  const createOffer = useCallback(async (userId: string, socket: Socket, roomId: string) => {
    const pc = peerConnections.current.get(userId);
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('webrtc:signal', {
      type: 'offer',
      to: userId,
      roomId,
      payload: offer,
    });
  }, []);

  const createAnswer = useCallback(async (userId: string, offer: RTCSessionDescriptionInit, socket: Socket, roomId: string) => {
    const pc = peerConnections.current.get(userId);
    if (!pc) return;

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc:signal', {
      type: 'answer',
      to: userId,
      roomId,
      payload: answer,
    });
  }, []);

  const handleICECandidate = useCallback((userId: string, candidate: RTCIceCandidateInit, socket: Socket, roomId: string) => {
    const pc = peerConnections.current.get(userId);
    if (!pc) return;

    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
      console.error('Error adding ICE candidate:', err);
    });
  }, []);

  const startScreenShare = useCallback(async (socket: Socket, roomId: string): Promise<MediaStream | null> => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      useMediaStore.getState().startScreenShare(screenStream);

      peerConnections.current.forEach((pc) => {
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare(socket, roomId);
      };

      socket.emit('screen-share:start', { roomId });

      return screenStream;
    } catch (err) {
      console.error('Failed to start screen share:', err);
      return null;
    }
  }, []);

  const stopScreenShare = useCallback((socket: Socket, roomId: string) => {
    const state = useMediaStore.getState();
    state.screenStream?.getTracks().forEach((t) => t.stop());
    useMediaStore.getState().stopScreenShare();

    const localStream = state.localStream;
    const videoTrack = localStream?.getVideoTracks()[0];

    peerConnections.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    });

    socket.emit('screen-share:stop', { roomId });
  }, []);

  const cleanup = useCallback(() => {
    peerConnections.current.forEach((pc) => {
      pc.close();
    });
    peerConnections.current.clear();
    setPeerStatus({});

    const state = useMediaStore.getState();
    state.localStream?.getTracks().forEach((t) => t.stop());
    state.screenStream?.getTracks().forEach((t) => t.stop());
    state.setLocalStream(null);
    state.stopScreenShare();
    state.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((t) => t.stop());
    });
  }, []);

  return {
    getLocalMedia,
    createPeerConnection,
    createOffer,
    createAnswer,
    handleICECandidate,
    startScreenShare,
    stopScreenShare,
    cleanup,
    peerStatus,
  };
}
