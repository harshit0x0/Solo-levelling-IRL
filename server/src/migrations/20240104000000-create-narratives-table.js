'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create narratives table
    await queryInterface.createTable('narratives', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      taskLogId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'task_logs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      narrative: {
        type: Sequelize.TEXT,
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

    // Create indexes
    await queryInterface.addIndex('narratives', ['taskLogId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('narratives');
  },
};
