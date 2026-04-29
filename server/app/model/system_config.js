'use strict';

module.exports = app => {
  const { INTEGER, STRING, TEXT } = app.Sequelize;

  const SystemConfig = app.model.define('SystemConfig', {
    id: { type: INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    groupName: { type: STRING(50), allowNull: false, field: 'group_name' },
    key: { type: STRING(100), allowNull: false },
    value: TEXT,
    type: { type: STRING(20), defaultValue: 'string' },
    description: STRING(200),
  }, {
    tableName: 'system_configs',
    underscored: true,
    timestamps: true,
  });

  return SystemConfig;
};
