
import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Question {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  timestamp: Timestamp;
  answerCount: number;
}

export interface Answer {
  id: string;
  questionId: string;
  body: string;
  authorId: string;
  authorName: string;
  timestamp: Timestamp;
  upvotes: number;
  downvotes: number;
  votedBy: { [key: string]: 'up' | 'down' };
}
