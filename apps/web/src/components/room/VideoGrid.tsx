import { useMemo } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { VideoCard } from './VideoCard';

function getGridClasses(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 6) return 'grid-cols-3';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

function getGridRows(count: number): string {
  if (count <= 1) return 'grid-rows-1';
  if (count <= 2) return 'grid-rows-1';
  if (count <= 4) return 'grid-rows-2';
  if (count <= 6) return 'grid-rows-2';
  if (count <= 9) return 'grid-rows-3';
  return 'grid-rows-3';
}

export function VideoGrid() {
  const members = useRoomStore((s) => s.members);
  const localStream = useMediaStore((s) => s.localStream);
  const remoteStreams = useMediaStore((s) => s.remoteStreams);
  const isSpeaking = useMediaStore((s) => s.isSpeaking);

  const screenSharer = useMemo(
    () => members.find((m) => m.isScreenSharing),
    [members]
  );

  const otherMembers = useMemo(
    () => members.filter((m) => !m.isScreenSharing),
    [members]
  );

  if (screenSharer) {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex-1 min-h-0">
          <VideoCard
            member={screenSharer}
            stream={remoteStreams.get(screenSharer.userId)}
            connectionQuality="good"
          />
        </div>

        {otherMembers.length > 0 && (
          <div className="h-32 flex gap-2 overflow-x-auto pb-1">
            {otherMembers.map((member) => (
              <div key={member.userId} className="w-44 shrink-0">
                <VideoCard
                  member={member}
                  stream={remoteStreams.get(member.userId)}
                  connectionQuality="good"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const total = members.length;
  const gridClasses = getGridClasses(total);
  const gridRows = getGridRows(total);

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <p className="text-gray-400 text-sm">Waiting for participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClasses} ${gridRows} gap-3 h-full auto-rows-fr`}>
      {members.map((member) => {
        const isLocal = false;
        const stream = remoteStreams.get(member.userId);
        const speaking = member.userId === 'local' ? isSpeaking : false;

        return (
          <VideoCard
            key={member.userId}
            member={member}
            stream={stream}
            isLocal={isLocal}
            connectionQuality="good"
            speaking={speaking}
          />
        );
      })}
    </div>
  );
}
