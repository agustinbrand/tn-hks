import app from "./app.js";
import env from "./config/env.js";
import { migrate } from "./lib/db.js";
import logger from "./lib/logger.js";

async function bootstrap() {
  try {
    await migrate();
    app.listen(env.PORT, () => {
      logger.info(`Server listening on :${env.PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();
