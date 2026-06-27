// @krypton/engine — public API

// Board generation
export { generateBoard, maskBoardForOperative } from './boardGenerator.js';

// Word list
export { pickWords, WORD_POOL } from './wordList.js';

// Team management
export {
  selectStartingTeam,
  assignTeamsRandomly,
  validateTeamComposition,
} from './teamGenerator.js';

// Validators
export {
  canGiveClue,
  canRevealCard,
  canEndTurn,
  canStartGame,
  isGameOver,
} from './validators.js';
export type { GameOverResult } from './validators.js';

// Reducer
export { gameReducer } from './gameReducer.js';
export type { EngineAction } from './gameReducer.js';
