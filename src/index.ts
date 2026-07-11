import { env } from "./config/env.js";

function bootstrap(): void {
  console.log("Croit development environment is ready.");
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
}

bootstrap();
