import app from './src/app.js';
import connectDB from './src/config/db.js';
import Giveaway from './src/models/Giveaway.js';
import { seedDatabase } from './src/utils/seedData.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    // Check if initial seed is needed
    const giveawayCount = await Giveaway.countDocuments();
    if (giveawayCount === 0) {
      console.log('[Server Startup]: No giveaways found in database. Running initial seed...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`[VELOOP Server]: Running on http://localhost:${PORT}`);
      console.log(`[Environment]: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('[Server Startup Failure]:', error);
    process.exit(1);
  }
};

startServer();
