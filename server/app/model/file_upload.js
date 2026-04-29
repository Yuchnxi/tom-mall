'use strict';

module.exports = app => {
  const { BIGINT, STRING, TINYINT } = app.Sequelize;

  const FileUpload = app.model.define('FileUpload', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    uploaderId: BIGINT.UNSIGNED,
    uploaderType: { type: TINYINT, defaultValue: 1 },
    originalName: STRING(255),
    fileName: { type: STRING(255), allowNull: false },
    filePath: { type: STRING(500), allowNull: false },
    fileUrl: { type: STRING(500), allowNull: false },
    fileType: STRING(50),
    fileSize: BIGINT,
    storage: { type: STRING(50), defaultValue: 'oss' },
  }, {
    tableName: 'file_uploads',
    underscored: true,
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
  });

  return FileUpload;
};
