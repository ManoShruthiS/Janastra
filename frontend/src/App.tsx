import React, { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { MeetingRoom } from './components/MeetingRoom';

export function App() {
  const [inMeeting, setInMeeting] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Check URL query parameters for ?code=JAN-XXX-YYY
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setMeetingCode(codeParam.toUpperCase());
    }
  }, []);

  const handleJoin = (code: string, name: string, hostFlag: boolean) => {
    const newParticipantId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setMeetingCode(code);
    setDisplayName(name);
    setIsHost(hostFlag);
    setParticipantId(newParticipantId);
    setInMeeting(true);

    // Update URL without reloading
    const newUrl = `${window.location.pathname}?code=${encodeURIComponent(code)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleLeave = () => {
    setInMeeting(false);
    setMeetingCode('');
    setDisplayName('');
    setParticipantId('');
    setIsHost(false);

    // Clean URL
    window.history.pushState({}, '', window.location.pathname);
  };

  return inMeeting ? (
    <MeetingRoom
      meetingCode={meetingCode}
      participantId={participantId}
      displayName={displayName}
      initialIsHost={isHost}
      onLeave={handleLeave}
    />
  ) : (
    <Lobby onJoinMeeting={handleJoin} />
  );
}

export default App;
