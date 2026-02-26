import "dotenv/config";
import app from "./src/app.js";
import sequelize from "./src/config/db.js";
import "./src/models/Contact.js"; // register model with Sequelize before sync

const PORT = process.env.PORT || 3000;

try {
  await sequelize.authenticate();
  // sync() creates tables that don't yet exist (non-destructive)
  await sequelize.sync();
  console.log("PostgreSQL connected");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
} catch (err) {
  console.error("Database connection error:", err);
  process.exit(1);
}
