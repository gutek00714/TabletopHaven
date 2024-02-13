<template>
  <div class="group-detail-container">
    <div v-if="loading" class="loading-error">Loading group details...</div>
    <div v-else-if="error" class="loading-error">{{ error }}</div>
    <div v-else>
      <h2 class="group-name">{{ groupName }}</h2>

      <section class="group-members">
        <h3>Members</h3>
        <ul>
          <li v-for="member in members" :key="member.id">
            <img :src="member.profile_image_url" alt="Member Image" class="member-image">
            {{ member.username }}
          </li>
        </ul>
      </section>

      <section class="group-games">
        <h3>Games Owned by Group</h3>
        <ul>
          <li v-for="game in games" :key="game.id">
            {{ game.name }}
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GroupDetail',
  data() {
    return {
      groupName: '',
      members: [],
      games: [],
      loading: false,
      error: null
    };
  },
  async created() {
    await this.fetchGroupDetails();
  },
  methods: {
    async fetchGroupDetails() {
      const groupId = this.$route.params.groupId;
      this.loading = true;
      try {
        const membersResponse = await axios.get(`http://localhost:3000/group/${groupId}/members`);
        const gamesResponse = await axios.get(`http://localhost:3000/group/${groupId}/games`);
        this.groupName = `Group ${groupId}`; // Replace with actual group name if available
        this.members = membersResponse.data;
        this.games = gamesResponse.data;
      } catch (error) {
        this.error = 'An error occurred while fetching group details.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.group-detail-container {
  /* Style for group detail container */
}

.group-name {
  /* Style for group name */
}

.group-members, .group-games {
  /* Style for sections */
}

.member-image {
  /* Style for member images */
}
</style>
