<template>
  <div class="col m11 column-background">
    <div class="group-detail-container">
      <div v-if="loading" class="loading-error">Loading group details...</div>
      <div v-else-if="error" class="loading-error">{{ error }}</div>
      <div v-else>
        <div class="group-members-and-chat">
          <div class="group-members">
            <h4 class="group-name">{{ groupName }}</h4>
            <h4>Members</h4>
            <ul class="friends-list">
              <li v-for="member in members" :key="member.id">
                <router-link :to="`/user/${member.id}`" class="friend-item">
                  <img :src="member.profile_image_url" class="member-image" alt="Member Image">
                  <span class="friend-name">{{ member.username }}</span>
                </router-link>
              </li>
            </ul>
          </div>

          <div class="group-chat">
            <h4>Group Chat</h4>
            <div class="chat-container">
              <!-- Chat messages  -->
            </div>
          </div>
        </div>

        <section class="group-games">
          <h4>Games Owned by Group</h4>
          <ul class="game-list">
            <GameCard v-for="game in games" :key="game.id" :game="game"/>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import GameCard from './SmallGameCard.vue';

export default {
  components: { GameCard },
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
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
.column-background.main-content {
  margin-left: 2.5rem;
  border-radius: 5px;
}

.group-detail-container {
  margin: 33px;
}

.group-members-and-chat {
  display: flex;
  flex-wrap: wrap;
}

.group-chat{
  margin-top: 60px;
}

.group-members, .group-chat {
  width: 100%; 
  box-sizing: border-box; 
}

@media (min-width: 768px) {
  .group-members {
    width: 45%; 
  }

  .group-chat {
    width: 45%; 
  }
}

.group-games {
  margin-top: 20px;
}

.friends-list {
  list-style-type: none;
  padding: 0;
  gap: 1rem;
}

.friend-item {
  margin: 0.5rem;
  padding: 1.5rem;
  border-radius: 10px;
  background-color: #272538;
  transition: all 0.3s ease;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  color: #FFF;
  display: inline-flex;
  align-items: center;
  text-align: left;
  min-height: 100px;
  width: auto;
  max-width: fit-content;
  overflow: hidden; 
  font-size:18px;
}

.friend-item:hover {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

.member-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
}

.friend-name {
  font-size: 1.2em;
}

.chat-container {
  height: 450px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-y: scroll;
}

.game-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>