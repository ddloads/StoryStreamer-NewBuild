// src/utils/logger.js

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };
  
  class Logger {
    constructor(level = 'INFO') {
      this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    }
  
    debug(message, ...args) {
      if (this.level <= LOG_LEVELS.DEBUG) {
        console.log(`[DEBUG] ${message}`, ...args);
      }
    }
  
    info(message, ...args) {
      if (this.level <= LOG_LEVELS.INFO) {
        console.log(`[INFO] ${message}`, ...args);
      }
    }
  
    warn(message, ...args) {
      if (this.level <= LOG_LEVELS.WARN) {
        console.warn(`[WARN] ${message}`, ...args);
      }
    }
  
    error(message, ...args) {
      if (this.level <= LOG_LEVELS.ERROR) {
        console.error(`[ERROR] ${message}`, ...args);
      }
    }
  }
  
  export default new Logger(process.env.REACT_APP_LOG_LEVEL || 'INFO');