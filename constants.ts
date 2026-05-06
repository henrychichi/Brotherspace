import { Category } from './types.ts';

export const CATEGORIES: Category[] = ['Stress', 'Money', 'Relationships', 'Work', 'Life'];

export const BLOCKED_WORDS = [
  'offensiveword1', 
  'offensiveword2', 
  // Standard profanity list would go here
  'hate', 'kill', 'abuse'
];

export const SAFETY_MESSAGE = "This app is for support. Be respectful. No harmful advice.";

export const DAILY_PROMPTS = [
  "What's stressing you most right now?",
  "What lesson did life teach you recently?",
  "How do you handle pressure when it feels like too much?",
  "What's one win you had this week, no matter how small?",
  "Who is one person you're grateful for today and why?",
  "What is a boundary you're struggling to set?",
  "What's one thing you wish people understood about your grind?",
  "If you could give your younger self one piece of advice, what would it be?",
  "What's the hardest part about being a man in your circle right now?",
  "How are you really doing today? No 'I'm fine' allowed."
];
