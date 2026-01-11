import sequelize from '../src/config/database';

describe('Database Connection', () => {
  it('should connect to the database successfully', async () => {
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  it('should have a valid connection object', () => {
    expect(sequelize).toBeDefined();
    expect(sequelize.getDialect()).toBe('postgres');
  });
});
