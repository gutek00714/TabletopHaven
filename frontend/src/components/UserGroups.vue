<template>
  <div class="col m11 column-background">
    <div class="section">
      <h4>User Groups</h4>
      <div class="row">
        <div v-for="group in groups" :key="group.id" class="group-card col m2" @click="goToGroupDetail(group.id)">
          <div class="group-name">{{ group.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import router from '@/router';

export default {
  name: 'UserGroups',
  data() {
    return {
      groups: [],
      loading: false,
      error: null,
    };
  },
  async created() {
    await this.fetchUserGroups();
  },
  methods: {
    async fetchUserGroups() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/user-groups', { withCredentials: true });
        this.groups = response.data;
      } catch (error) {
        this.error = error.response && error.response.data.message ? error.response.data.message : 'An error occurred while fetching groups.';
      } finally {
        this.loading = false;
      }
    },
    goToGroupDetail(groupId) {
      router.push({ name: 'GroupDetail', params: { groupId } });
    }
  }
}
</script>

<style scoped>
.group-card {
  cursor: pointer;
  /* Add more styles for your group card */
}

.group-name {
  /* Style for group name */
}
</style>
