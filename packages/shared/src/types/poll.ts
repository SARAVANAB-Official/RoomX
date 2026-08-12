export enum PollStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

export interface PollOption {
  id: string;
  text: string;
  votes: PollVote[];
  voteCount: number;
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  votedAt: Date;
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  status: PollStatus;
  createdBy: string;
  createdAt: Date;
  endsAt?: Date;
  totalVotes: number;
  allowMultipleVotes: boolean;
  isAnonymous: boolean;
}