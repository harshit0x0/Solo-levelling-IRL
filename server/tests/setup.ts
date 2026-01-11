import sequelize from '../src/config/database';
import models from '../src/models';

// Ensure models are initialized before tests
beforeAll(async () => {
  // Sync database schema (creates tables if they don't exist)
  await sequelize.sync({ force: false });
});

// Clean up database after all tests
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Clean up test data after each test
afterEach(async () => {
  // Clean up in reverse order of dependencies
  await models.TaskLog.destroy({ where: {}, force: true });
  await models.Task.destroy({ where: {}, force: true });
  await models.Stats.destroy({ where: {}, force: true });
  await models.Player.destroy({ where: {}, force: true });
});
