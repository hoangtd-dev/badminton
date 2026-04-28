import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import membersRouter from "./routes/members";
import sessionsRouter from "./routes/sessions";
import transactionsRouter from "./routes/transactions";
import notifyRouter from "./routes/notify";
import voteRouter from "./routes/vote";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5174",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/members", membersRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/notify", notifyRouter);
app.use("/api/vote", voteRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
