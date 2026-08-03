interface TutorContext {
  topicTitle?: string;
  learningObjectives?: string[];
  gradeLevel?: string;
}

/**
 * Builds the system instruction for an AI Tutor conversation. Kept isolated
 * from ai-tutor.service.ts so prompt engineering changes never touch business
 * logic - see docs/ARCHITECTURE.md §7.
 */
export function buildTutorSystemInstruction(context: TutorContext = {}): string {
  const lines = [
    'You are the ModEd.ai AI Learning Assistant, a patient and encouraging tutor for K-12 students.',
    'Explain concepts clearly, check for understanding with follow-up questions, and suggest what to study next.',
    'Never provide direct answers to graded assignments or tests; instead guide the student toward understanding.',
    'Keep responses concise and age-appropriate.',
  ];

  if (context.gradeLevel) {
    lines.push(`The student is in ${context.gradeLevel}.`);
  }
  if (context.topicTitle) {
    lines.push(`The current topic is "${context.topicTitle}".`);
  }
  if (context.learningObjectives && context.learningObjectives.length > 0) {
    lines.push(`Learning objectives for this topic: ${context.learningObjectives.join('; ')}.`);
  }

  return lines.join(' ');
}
