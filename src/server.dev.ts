import colors from "colors";
import { Server } from "socket.io";
import app from "./index";
import config from "./config";
import { socketHelper } from "./helpers/socketHelper";
import { errorLogger, logger } from "./shared/logger";
import DBConnection from "./DB/ConnentDB";
import { superUserCreate } from "./DB/SuperUserCreate";
import mongoose from "mongoose";

//uncaught exception
process.on("uncaughtException", (error) => {
  errorLogger.error("UnhandleException Detected", error);
  process.exit(1);
});

let server: any;
async function main() {
  try {
    // await mongoose.connect(`mongodb://localhost:27017/boolbi`)
    console.log("🚀 ~ main ~ config.db_url_remote:", config.db_url_remote);
    await mongoose
      .connect(`${config.db_url_remote}`)
      .then(
        (response) => (
          console.log(
            colors.green("✅ Your Database was hosted on: ") +
              colors.cyan(response.connection.host)
          ),
          console.log(
            colors.green("✅ Your Database is running on port: ") +
              colors.yellow(response.connection.port.toString())
          ),
          console.log(
            colors.green("✅ Your Database name is: ") +
              colors.magenta(response.connection.name)
          )
        )
      );

    // Seed Super Admin after database connection is successful
    await superUserCreate();

    const port =
      typeof config.port === "number" ? config.port : Number(config.port);

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on port:${config.port}`)
      );
    });

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: "*",
      },
    });
    socketHelper.socket(io);
    //@ts-ignore
    global.io = io;
  } catch (error) {
    errorLogger.error(colors.red("🤢 Failed to connect Database"));
  }

  //handle unhandleRejection
  process.on("unhandledRejection", (error) => {
    if (server) {
      server.close(() => {
        errorLogger.error("UnhandleRejection Detected", error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

main();

//SIGTERM
process.on("SIGTERM", () => {
  logger.info("SIGTERM IS RECEIVE");
  if (server) {
    server.close();
  }
});
