import pino from 'pino'
import { env } from '../../config/env'

export const logger = pino({
  level: env.logging.level,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'authorization',
      'password',
      '*.password',
      'token',
      '*.token',
    ],
    remove: true,
  },
})
