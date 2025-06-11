
// Basic text utility functions

/**
 * Splits a given text into an array of sentences.
 * Attempts to split by common sentence-ending punctuation (. ! ?).
 * Handles multiple spaces and trims resulting sentences.
 * @param text The text to split.
 * @returns An array of sentence strings.
 */
export const splitIntoSentences = (text: string): string[] => {
  if (!text || text.trim() === "") {
    return [];
  }
  // Regex to split by sentences, keeping the punctuation.
  // It looks for sequences not ending in punctuation, followed by punctuation.
  // Or, sequences not ending in punctuation, if it's the end of the string.
  const sentences = text.match(/[^.!?]+[.!?]+|[A-Za-z0-9_-\s]+(?:$|\n)/g);
  
  if (!sentences) {
    return [text.trim()].filter(s => s.length > 0); // Fallback if no punctuation, return the whole text as one sentence
  }
  
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
};


/**
 * Groups an array of sentences into chunks, where each chunk contains
 * a specified maximum number of sentences.
 * @param sentences An array of sentence strings.
 *   maxSentencesPerChunk The maximum number of sentences allowed in each chunk.
 * @returns An array of strings, where each string is a chunk of sentences.
 */
export const groupSentencesIntoChunks = (
  sentences: string[], 
  maxSentencesPerChunk: number = 2
): string[] => {
  if (!sentences || sentences.length === 0) {
    return [];
  }
  if (maxSentencesPerChunk <= 0) {
    maxSentencesPerChunk = 2; // Default to 2 if invalid value provided
  }

  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += maxSentencesPerChunk) {
    const chunkSentences = sentences.slice(i, i + maxSentencesPerChunk);
    chunks.push(chunkSentences.join(" ").trim());
  }
  return chunks.filter(chunk => chunk.length > 0);
};
