'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'weekly' to the tasks.type ENUM
    // PostgreSQL requires altering the enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tasks_type" ADD VALUE IF NOT EXISTS 'weekly';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type, which is complex
    // For now, we'll leave it as a no-op
    // In production, you'd need to:
    // 1. Create new enum without 'weekly'
    // 2. Update all rows
    // 3. Drop old enum
    // 4. Rename new enum
    throw new Error('Cannot remove enum value in PostgreSQL. Manual migration required.');
  }
};
