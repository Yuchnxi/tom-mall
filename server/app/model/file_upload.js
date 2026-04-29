'use strict';

module.exports = app => {
  const { BIGINT, STRING, INTEGER } = app.Sequelize;

  const FileUpload = app.model.define('FileUpload', {
    id: { type: BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    bizType: { type: STRING(50), field: 'biz_type' },
    fileName: { type: STRING(255), field: 'file_name', allowNull: false },
    fileUrl: { type: STRING(500), field: 'file_url', allowNull: false },
    fileSize: { type: BIGINT.UNSIGNED, field: 'file_size' },
    mimeType: { type: STRING(100), field: 'mime_type' },
    uploaderId: { type: BIGINT.UNSIGNED, field: 'uploader_id' },
    uploaderType: { type: STRING(20), field: 'uploader_type' },
    sort: { type: INTEGER, defaultValue: 0 },
  }, {
    tableName: 'file_uploads',
    underscored: true,
    timestamps: true,
  });

  return FileUpload;
};
