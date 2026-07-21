import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

const startServer = async () => {
    await connectDB();

    app.listen(env.PORT, () => {
        console.log(
            `🚀 Server running on http://localhost:${env.PORT}`
        );
    });
};

startServer();