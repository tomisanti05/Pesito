import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 3000;

await connectDatabase();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});