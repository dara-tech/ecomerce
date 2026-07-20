import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export type CallState = 'idle' | 'calling' | 'receiving' | 'active';

export function useWebRTC(socket: Socket | null, sessionId: string, role: 'user' | 'admin') {
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [withVideo, setWithVideo] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);

  const TURN_URLS = process.env.NEXT_PUBLIC_TURN_URLS?.split(',') || ['stun:stun.l.google.com:19302'];
  const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || '';
  const TURN_CREDENTIAL = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '';

  const rtcConfig = {
    iceServers: [
      { urls: TURN_URLS, username: TURN_USERNAME, credential: TURN_CREDENTIAL }
    ]
  };

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
  }, [localStream]);

  const endCall = useCallback(() => {
    if (socket) {
      socket.emit('webrtc_call_ended', { sessionId, fromRole: role });
    }
    cleanup();
  }, [socket, sessionId, role, cleanup]);

  const rejectCall = useCallback(() => {
    if (socket) {
      socket.emit('webrtc_call_rejected', { sessionId, fromRole: role });
    }
    cleanup();
  }, [socket, sessionId, role, cleanup]);

  // Setup Peer Connection
  const setupPeerConnection = useCallback(async (isInitiator: boolean) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', { sessionId, fromRole: role, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: withVideo, audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    } catch (e) {
      console.error('Failed to get local media', e);
      endCall();
      return;
    }

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socket) {
          socket.emit('webrtc_offer', { sessionId, fromRole: role, offer });
        }
      } catch (e) {
        console.error('Error creating offer', e);
      }
    }
  }, [socket, sessionId, role, withVideo, endCall, rtcConfig]);

  const makeCall = useCallback(async (video = true) => {
    setWithVideo(video);
    setCallState('calling');
    if (socket) {
      socket.emit('webrtc_call_request', { sessionId, fromRole: role, withVideo: video });
    }
  }, [socket, sessionId, role]);

  const acceptCall = useCallback(async () => {
    setCallState('active');
    if (socket) {
      socket.emit('webrtc_call_accepted', { sessionId, fromRole: role });
    }
    await setupPeerConnection(false); // receiver
  }, [socket, sessionId, role, setupPeerConnection]);

  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc_call_request', ({ fromRole, withVideo: requestVideo }) => {
      if (fromRole !== role) {
        setWithVideo(requestVideo);
        setCallState('receiving');
      }
    });

    socket.on('webrtc_call_accepted', async ({ fromRole }) => {
      if (fromRole !== role) {
        setCallState('active');
        await setupPeerConnection(true); // Initiator sets up PC and sends offer
      }
    });

    socket.on('webrtc_call_rejected', ({ fromRole }) => {
      if (fromRole !== role) {
        cleanup();
        alert('Call was rejected');
      }
    });

    socket.on('webrtc_call_ended', ({ fromRole }) => {
      if (fromRole !== role) {
        cleanup();
      }
    });

    socket.on('webrtc_offer', async ({ fromRole, offer }) => {
      if (fromRole !== role && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit('webrtc_answer', { sessionId, fromRole: role, answer });
        } catch (e) {
          console.error('Error handling offer', e);
        }
      }
    });

    socket.on('webrtc_answer', async ({ fromRole, answer }) => {
      if (fromRole !== role && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error handling answer', e);
        }
      }
    });

    socket.on('webrtc_ice_candidate', async ({ fromRole, candidate }) => {
      if (fromRole !== role && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    });

    return () => {
      socket.off('webrtc_call_request');
      socket.off('webrtc_call_accepted');
      socket.off('webrtc_call_rejected');
      socket.off('webrtc_call_ended');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
    };
  }, [socket, role, sessionId, setupPeerConnection, cleanup]);

  return {
    callState,
    localStream,
    remoteStream,
    makeCall,
    acceptCall,
    rejectCall,
    endCall
  };
}
