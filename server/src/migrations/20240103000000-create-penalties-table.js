'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create penalties table
    await queryInterface.createTable('penalties', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      reason: {
        type: Sequelize.ENUM('missed_task', 'rank_lock', 'xp_loss'),
        allowNull: false,
      },
      severity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('penalties', ['playerId']);
    await queryInterface.addIndex('penalties', ['reason']);
    await queryInterface.addIndex('penalties', ['expiresAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('penalties');
  }
};
