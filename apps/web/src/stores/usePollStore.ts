import { create } from 'zustand';
import { PollStatus } from '@roomx/shared';
import type { Poll } from '@roomx/shared';

interface PollState {
  polls: Poll[];
  activePoll: Poll | null;
  addPoll: (poll: Poll) => void;
  setPolls: (polls: Poll[]) => void;
  updatePoll: (pollId: string, updates: Partial<Poll>) => void;
  votePoll: (pollId: string, optionId: string, userId: string) => void;
  closePoll: (pollId: string) => void;
}

export const usePollStore = create<PollState>((set) => ({
  polls: [],
  activePoll: null,

  addPoll: (poll) =>
    set((state) => ({
      polls: [...state.polls, poll],
      activePoll: poll.status === PollStatus.ACTIVE ? poll : state.activePoll,
    })),

  setPolls: (polls) => set({ polls }),

  updatePoll: (pollId, updates) =>
    set((state) => ({
      polls: state.polls.map((p) => (p.id === pollId ? { ...p, ...updates } : p)),
      activePoll:
        state.activePoll?.id === pollId
          ? { ...state.activePoll, ...updates }
          : state.activePoll,
    })),

  votePoll: (pollId, optionId, userId) =>
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((o) =>
            o.id === optionId
              ? {
                  ...o,
                  voteCount: o.voteCount + 1,
                  votes: [
                    ...(o.votes ?? []),
                    {
                      id: `${Date.now()}-${userId}`,
                      pollId,
                      optionId,
                      userId,
                      votedAt: new Date(),
                    },
                  ],
                }
              : o
          ),
          totalVotes: p.totalVotes + 1,
        };
      }),
    })),

  closePoll: (pollId) =>
    set((state) => ({
      polls: state.polls.map((p) =>
        p.id === pollId ? { ...p, status: PollStatus.CLOSED } : p
      ),
      activePoll:
        state.activePoll?.id === pollId ? null : state.activePoll,
    })),
}));
