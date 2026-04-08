<template>
  <n-card title="用户管理">
    <template #header-extra>
      <n-button type="primary" @click="showCreateModal = true">
        新增用户
      </n-button>
    </template>

    <n-data-table
      :columns="columns"
      :data="users"
      :bordered="false"
      :loading="loading"
      :pagination="pagination"
    />
  </n-card>

  <!-- 创建用户弹窗 -->
  <n-modal v-model:show="showCreateModal" preset="card" title="新增用户" style="width: 500px;">
    <n-form ref="createFormRef" :model="newUser" :rules="createRules">
      <n-form-item label="API Key" path="apiKey">
        <n-input v-model:value="newUser.apiKey" placeholder="请输入 API Key" />
      </n-form-item>
      <n-form-item label="用户名" path="name">
        <n-input v-model:value="newUser.name" placeholder="请输入用户名" />
      </n-form-item>
      <n-form-item label="昵称" path="nickname">
        <n-input v-model:value="newUser.nickname" placeholder="可选" />
      </n-form-item>
      <n-form-item label="角色" path="roleId">
        <n-select v-model:value="newUser.roleId" :options="roleOptions" />
      </n-form-item>
      <n-form-item label="头像URL" path="avatar">
        <n-input v-model:value="newUser.avatar" placeholder="可选" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="showCreateModal = false">取消</n-button>
        <n-button type="primary" :loading="creating" @click="handleCreate">
          创建
        </n-button>
      </div>
    </template>
  </n-modal>

  <!-- 编辑用户弹窗 -->
  <n-modal v-model:show="showEditModal" preset="card" title="编辑用户" style="width: 500px;">
    <n-form ref="editFormRef" :model="editUser" :rules="editRules">
      <n-form-item label="用户名" path="name">
        <n-input v-model:value="editUser.name" />
      </n-form-item>
      <n-form-item label="昵称" path="nickname">
        <n-input v-model:value="editUser.nickname" />
      </n-form-item>
      <n-form-item label="角色" path="roleId">
        <n-select v-model:value="editUser.roleId" :options="roleOptions" />
      </n-form-item>
      <n-form-item label="头像URL" path="avatar">
        <n-input v-model:value="editUser.avatar" />
      </n-form-item>
    </n-form>
    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <n-button @click="showEditModal = false">取消</n-button>
        <n-button type="primary" :loading="editing" @click="handleEdit">
          保存
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, h } from 'vue'
import { useMessage } from 'naive-ui'
import { usersApi } from '@/api'
import type { DataTableColumns } from 'naive-ui'

interface User {
  id: number
  apiKey: string
  name: string
  nickname?: string
  role: {
    id: number
    name: string
    description?: string
  }
  avatar?: string
  createdAt: string
}

interface Role {
  id: number
  name: string
}

const message = useMessage()

const loading = ref(false)
const creating = ref(false)
const editing = ref(false)
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const showCreateModal = ref(false)
const showEditModal = ref(false)

const createFormRef = ref()
const editFormRef = ref()

const newUser = reactive({
  apiKey: '',
  name: '',
  nickname: '',
  roleId: null as number | null,
  avatar: ''
})

const editUser = reactive({
  id: null as number | null,
  name: '',
  nickname: '',
  roleId: null as number | null,
  avatar: ''
})

const roleOptions = ref<{ label: string; value: number }[]>([])

const createRules = {
  apiKey: { required: true, message: '请输入 API Key', trigger: 'blur' },
  name: { required: true, message: '请输入用户名', trigger: 'blur' },
  roleId: { required: true, message: '请选择角色', trigger: 'change' }
}

const editRules = {
  name: { required: true, message: '请输入用户名', trigger: 'blur' },
  roleId: { required: true, message: '请选择角色', trigger: 'change' }
}

const columns: DataTableColumns<User> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'API Key', key: 'apiKey', width: 200 },
  { title: '用户名', key: 'name', width: 120 },
  { title: '昵称', key: 'nickname', width: 120 },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render(row) {
      return h('span', {}, row.role.name)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      return h('div', { style: 'display: flex; gap: 8px;' }, [
        h('button', {
          onClick: () => handleEditClick(row)
        }, '编辑'),
        h('button', {
          onClick: () => handleDelete(row.id),
          style: 'color: #d03050;'
        }, '删除')
      ])
    }
  }
]

const pagination = {
  pageSize: 20
}

async function loadUsers() {
  try {
    loading.value = true
    const res = await usersApi.getAll()
    if (res.success) {
      users.value = res.data
    }
  } catch (error) {
    message.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  try {
    // 这里暂时硬编码，后续可以调用 /roles API
    roleOptions.value = [
      { label: '管理员', value: 1 },
      { label: '用户', value: 2 }
    ]
  } catch (error) {
    console.error('Failed to load roles:', error)
  }
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate()
    creating.value = true

    const res = await usersApi.create({
      apiKey: newUser.apiKey,
      name: newUser.name,
      nickname: newUser.nickname || undefined,
      roleId: newUser.roleId!,
      avatar: newUser.avatar || undefined
    })

    if (res.success) {
      message.success('创建成功')
      showCreateModal.value = false
      Object.assign(newUser, {
        apiKey: '',
        name: '',
        nickname: '',
        roleId: null,
        avatar: ''
      })
      await loadUsers()
    } else {
      message.error(res.error || '创建失败')
    }
  } catch (error: any) {
    if (error?.error) {
      message.error(error.error)
    }
  } finally {
    creating.value = false
  }
}

function handleEditClick(user: User) {
  editUser.id = user.id
  editUser.name = user.name
  editUser.nickname = user.nickname || ''
  editUser.roleId = user.role.id
  editUser.avatar = user.avatar || ''
  showEditModal.value = true
}

async function handleEdit() {
  try {
    await editFormRef.value?.validate()
    editing.value = true

    const res = await usersApi.update(editUser.id!, {
      name: editUser.name,
      nickname: editUser.nickname || undefined,
      roleId: editUser.roleId!,
      avatar: editUser.avatar || undefined
    })

    if (res.success) {
      message.success('更新成功')
      showEditModal.value = false
      await loadUsers()
    } else {
      message.error(res.error || '更新失败')
    }
  } catch (error: any) {
    if (error?.error) {
      message.error(error.error)
    }
  } finally {
    editing.value = false
  }
}

async function handleDelete(userId: number) {
  try {
    await usersApi.delete(userId)
    message.success('删除成功')
    await loadUsers()
  } catch (error: any) {
    message.error(error?.error || '删除失败')
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<style scoped>
button {
  cursor: pointer;
  border: none;
  background: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
button:hover {
  background: #e5e5e5;
}
</style>