import express from "express";
import identifyRoutes from "./routes/identifyRoutes.js";

const app = express();

app.use(express.json());

app.use("/", identifyRoutes);

export default app;
