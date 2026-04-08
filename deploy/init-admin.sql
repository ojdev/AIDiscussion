-- 插入角色数据
INSERT INTO roles ("name", "description") VALUES
  ('admin', 'Administrator'),
  ('user', 'Regular User')
ON CONFLICT ("name") DO NOTHING;

-- 插入管理员用户 (请修改 API Key)
INSERT INTO users ("apiKey", "name", "nickname", "roleId", "avatar", "createdAt", "updatedAt")
VALUES
  ('admin-ai-2025-secret-key', 'Admin', 'Admin', 1, '', NOW(), NOW())
ON CONFLICT ("apiKey") DO NOTHING;

-- 更新确保roleId正确
UPDATE users SET "roleId" = (SELECT "id" FROM roles WHERE "name" = 'admin')
WHERE "name" = 'Admin' AND "roleId" IS NULL;
