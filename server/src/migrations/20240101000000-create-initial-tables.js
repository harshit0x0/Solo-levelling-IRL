'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create players table
    await queryInterface.createTable('players', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      rank: {
        type: Sequelize.ENUM('E', 'D', 'C', 'B', 'A', 'S', 'SS'),
        allowNull: false,
        defaultValue: 'E',
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      totalXp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    // Create stats table
    await queryInterface.createTable('stats', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      playerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'players',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      physical: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      intelligence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      discipline: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      charisma: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      confidence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },
      creativity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
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

    // Create tasks table
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM('daily', 'dungeon', 'boss'),
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'extreme'),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      targetStat: {
        type: Sequelize.ENUM('physical', 'intelligence', 'discipline', 'charisma', 'confidence', 'creativity'),
        allowNull: false,
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false,
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

    // Create task_logs table
    await queryInterface.createTable('task_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'missed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      evidence: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      aiVerdict: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('stats', ['playerId']);
    await queryInterface.addIndex('task_logs', ['taskId']);
    await queryInterface.addIndex('task_logs', ['playerId']);
    await queryInterface.addIndex('task_logs', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('task_logs');
    await queryInterface.dropTable('tasks');
    await queryInterface.dropTable('stats');
    await queryInterface.dropTable('players');
  }
};
