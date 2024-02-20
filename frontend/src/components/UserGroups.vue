<template>
  <div class="col m11 column-background">
    <div class="section">
      <h4>User Groups</h4>
      <div class="row">
        <div v-for="group in groups" :key="group.id" class="group-card col m2" @click="goToGroupDetail(group.id)">
          <router-link :to="`/group/${group.id}`" class="group-item">
            <div class="group-name">{{ group.name }}</div>
          </router-link>
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

.group-item {
  text-decoration: none;
  color: inherit;
}

.group-name {
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 10px;
  background-color: #272538;
  transition: all 0.3s ease;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  color: #FFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100px;
  width: 190px;
  overflow: hidden; 
  font-size:18px;
}

.group-name:hover {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}
</style>
