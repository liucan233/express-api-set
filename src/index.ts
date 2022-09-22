import './preStart'; // Must be the first import
import logger from 'jet-logger';

import envVars from '@shared/envVars';
import server from './server';


// Constants
const serverStartMsg = 'Express server started on port: ';

// Start server
server.listen(envVars.port, () => {
  logger.info(serverStartMsg + envVars.port.toString());
});
