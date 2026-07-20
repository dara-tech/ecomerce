import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

interface VideoCallModalProps {
  onClose: () => void;
}

export function VideoCallModal({ onClose }: VideoCallModalProps) {
  const { 
    callState, 
    localStream, 
    remoteStream, 
    endCall, 
    acceptCall, 
    rejectCall 
  } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (callState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Remote Video (Main) */}
        <div className="flex-1 relative bg-black flex items-center justify-center">
          {callState === 'receiving' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900/90">
              <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse mb-6">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Incoming Video Call...</h2>
              <p className="text-gray-400 mb-8">Admin is calling you</p>
              
              <div className="flex gap-6">
                <button 
                  onClick={rejectCall}
                  className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
                <button 
                  onClick={acceptCall}
                  className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                >
                  <Phone className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          )}

          {callState === 'calling' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900/90">
              <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Calling...</h2>
              <p className="text-gray-400 mb-8">Waiting for admin to answer</p>
            </div>
          )}

          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${(callState === 'receiving' || callState === 'calling') ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>

        {/* Local Video (PiP) */}
        <div className="absolute top-4 right-4 w-48 aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-gray-700 z-20">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full z-20 border border-gray-700">
          <button 
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={endCall}
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 mx-2"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
