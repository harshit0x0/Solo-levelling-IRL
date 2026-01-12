'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Create a test player
        await queryInterface.bulkInsert(
          'players',
          [
            {
              rank: 'E',
              level: 1,
              totalXp: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]
        );
    
        // Query to get the inserted player
        const [players] = await queryInterface.sequelize.query(
          "SELECT id FROM players WHERE rank = 'E' AND level = 1 ORDER BY id DESC LIMIT 1"
        );
        if (!players || players.length === 0) {
          throw new Error("Failed to seed test player: no matching player found");
        }
    
        // Create stats for the player
        await queryInterface.bulkInsert('stats', [
          {
            playerId: playerId,
            physical: 50,
            intelligence: 50,
            discipline: 50,
            charisma: 50,
            confidence: 50,
            creativity: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
    
        // Create a test task (no need to get the ID if not used)
        await queryInterface.bulkInsert(
          'tasks',
          [
            {
              type: 'daily',
              difficulty: "easy",
              description: 'Complete a 30-minute workout',
              targetStat: 'physical',
              xpReward: 100,
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]
        );
      },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('task_logs', null, {});
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('stats', null, {});
    await queryInterface.bulkDelete('players', null, {});
  },
};
