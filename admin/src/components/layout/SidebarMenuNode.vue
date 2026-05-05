<template>
  <el-sub-menu
    v-if="node.children?.length"
    :index="node.index"
  >
    <template #title>
      <el-icon>
        <component :is="node.icon" />
      </el-icon>
      <span>{{ node.label }}</span>
    </template>

    <SidebarMenuNode
      v-for="child in node.children"
      :key="child.index"
      :node="child"
    />
  </el-sub-menu>

  <el-menu-item
    v-else
    :index="node.index"
    :disabled="node.disabled"
  >
    <el-icon>
      <component :is="node.icon" />
    </el-icon>
    <template #title>
      <span>{{ node.label }}</span>
    </template>
  </el-menu-item>
</template>

<script setup>
defineOptions({
  name: 'SidebarMenuNode',
});

defineProps({
  node: {
    type: Object,
    required: true,
  },
});
</script>
