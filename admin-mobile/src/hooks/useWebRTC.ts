import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';

export type CallState = 'idle' | 'calling' | 'receiving' | 'active';

export function useWebRTC(socket: Socket | null, sessionId: string, role: 'user' | 'admin') {
  const [callState, setCallState] = useState<CallState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [withVideo, setWithVideo] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);

  const TURN_URLS = process.env.EXPO_PUBLIC_TURN_URLS?.split(',') || ['stun:stun.l.google.com:19302'];
  const TURN_USERNAME = process.env.EXPO_PUBLIC_TURN_USERNAME || '';
  const TURN_CREDENTIAL = process.env.EXPO_PUBLIC_TURN_CREDENTIAL || '';

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
      localStream.release();
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

  const setupPeerConnection = useCallback(async (isInitiator: boolean) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    (pc as any).addEventListener('icecandidate', (event: any) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', { sessionId, fromRole: role, candidate: event.candidate });
      }
    });

    (pc as any).addEventListener('track', (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    });

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? { facingMode: 'user' } : false,
      });
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

    const handleCallRequest = ({ fromRole, withVideo: requestVideo }: any) => {
      if (fromRole !== role) {
        setWithVideo(requestVideo);
        setCallState('receiving');
      }
    };

    const handleCallAccepted = async ({ fromRole }: any) => {
      if (fromRole !== role) {
        setCallState('active');
        await setupPeerConnection(true); // Initiator sets up PC and sends offer
      }
    };

    const handleCallRejected = ({ fromRole }: any) => {
      if (fromRole !== role) {
        cleanup();
        console.log('Call was rejected');
      }
    };

    const handleCallEnded = ({ fromRole }: any) => {
      if (fromRole !== role) {
        cleanup();
      }
    };

    const handleOffer = async ({ fromRole, offer }: any) => {
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
    };

    const handleAnswer = async ({ fromRole, answer }: any) => {
      if (fromRole !== role && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error handling answer', e);
        }
      }
    };

    const handleIceCandidate = async ({ fromRole, candidate }: any) => {
      if (fromRole !== role && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    socket.on('webrtc_call_request', handleCallRequest);
    socket.on('webrtc_call_accepted', handleCallAccepted);
    socket.on('webrtc_call_rejected', handleCallRejected);
    socket.on('webrtc_call_ended', handleCallEnded);
    socket.on('webrtc_offer', handleOffer);
    socket.on('webrtc_answer', handleAnswer);
    socket.on('webrtc_ice_candidate', handleIceCandidate);

    return () => {
      socket.off('webrtc_call_request', handleCallRequest);
      socket.off('webrtc_call_accepted', handleCallAccepted);
      socket.off('webrtc_call_rejected', handleCallRejected);
      socket.off('webrtc_call_ended', handleCallEnded);
      socket.off('webrtc_offer', handleOffer);
      socket.off('webrtc_answer', handleAnswer);
      socket.off('webrtc_ice_candidate', handleIceCandidate);
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
