// @krypton/engine — public API

// Board generation
export { generateBoard, maskBoardForOperative } from './boardGenerator.js';
export type { EngineAction } from './gameReducer.js';
// Reducer
export { gameReducer } from './gameReducer.js';
// Team management
export {
  assignTeamsRandomly,
  selectStartingTeam,
  validateTeamComposition,
} from './teamGenerator.js';
export type { GameOverResult } from './validators.js';
// Validators
export {
  canEndTurn,
  canGiveClue,
  canRevealCard,
  canStartGame,
  isGameOver,
} from './validators.js';
// Word list
export { pickWords, WORD_POOL } from './wordList.js';
