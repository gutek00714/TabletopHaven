<template>
  <div class="col m11 column-background">
    <div class="section">
      <div v-if="loading" class="loading-error">Loading group details...</div>
      <div v-else-if="error" class="loading-error">{{ error }}</div>
      <div v-else>
        <div v-if="isMemberOrOwner">
          <div class="row">
            <div class="group-members-and-chat">
              <div class="col m5">
                <div class="group-header">
                  <h4>{{ groupName }}</h4>
                  <div v-if="isOwner">
                    <button @click="toggleManageMode" class="manage-group-button">
                      {{ manageMode ? 'Exit Manage Mode' : 'Manage Group' }}
                    </button>
                  </div>
                  <div v-if="manageMode" class="delete-group">
                    <button @click="deleteGroup" class="delete-group-button">Delete Group</button>
                  </div>
                </div>
                <h4>Members</h4>
                <ul class="friends-list">
                  <div v-if="owner" class="member-container">
                    <router-link :to="`/user/${owner.id}`" class="friend-item">
                      <img :src="owner.profile_image_url" class="member-image" alt="Member Image">
                      <img class="owner" src="/crown.svg" alt="Owner"/>
                      <span class="friend-name">{{ owner.username }}</span>
                    </router-link>  
                  </div>              
                  <li v-for="member in members" :key="member.id">
                    <div class="member-container">
                      <router-link :to="`/user/${member.id}`" class="friend-item">
                        <img :src="member.profile_image_url" class="member-image" alt="Member Image">
                        <span class="friend-name">{{ member.username }}</span>
                      </router-link>
                      <button v-if="manageMode && !member.is_owner" @click.stop="removeMember(member.id)" class="remove-member-button">
                        <img class="remove" src="/remove.svg" alt="X"/>
                      </button>                  
                    </div>
                  </li>
                </ul>
              </div>

              <div class="col m7">
                <h4>Group Chat</h4>
                <div class="chat-container">
                  <!-- Chat messages  -->
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <section class="group-games">
              <h4>Games Owned by Group</h4>
              <div class="filters">
                <input type="number" v-model.number="playersFilter" placeholder="Number of Players">
                <input type="number" v-model.number="minPlayTimeFilter" placeholder="Min Play Time">
                <input type="number" v-model.number="maxPlayTimeFilter" placeholder="Max Play Time">
              </div>
              <ul class="game-list">
                <GameCard v-for="game in games" :key="game.id" :gameId="game.id"/>
              </ul>
            </section>
          </div>
        </div>
        <div v-else>
          <p>You are not a member of this group.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import GameCard from './SmallGameCard.vue';

export default {
  components: { GameCard },
  data() {
    return {
      userId: null,
      groupName: '',
      members: [],
      games: [],
      loading: false,
      error: null,
      manageMode: false,
      owner: { id: null },
      isMemberOrOwner: false,
      playersFilter: null,
      minPlayTimeFilter: null,
      maxPlayTimeFilter: null,
      filteredGames: [],
    };
  },
  
  watch: {
    playersFilter() {
      this.applyFilters();
    },
    minPlayTimeFilter() {
      this.applyFilters();
    },
    maxPlayTimeFilter() {
      this.applyFilters();
    }
  },

  async created() {
    await this.fetchGroupDetails();
    await Promise.all([this.fetchGroupDetails(), this.fetchCurrentUserId()]);
  },

  computed: {
    isOwner() {
      return this.owner?.id === this.userId;
    }
  },

  methods: {
    async applyFilters() {
      const invalidPlayerFilter = this.minPlayersFilter && this.maxPlayersFilter && this.minPlayersFilter > this.maxPlayersFilter;
      const invalidTimeFilter = this.minPlayTimeFilter && this.maxPlayTimeFilter && this.minPlayTimeFilter > this.maxPlayTimeFilter;

      if (invalidPlayerFilter || invalidTimeFilter) {
        this.filteredGames = [];
        return;
      }

      this.filteredGames = this.games.filter(game => {
        const isWithinPlayerRange = this.playersFilter === null || 
                                    (game.min_players <= this.playersFilter && game.max_players >= this.playersFilter);

        const minPlayTime = this.minPlayTimeFilter || -Infinity;
        const maxPlayTime = this.maxPlayTimeFilter || Infinity;
        const isWithinTimeRange = (game.play_time >= minPlayTime) && (game.play_time <= maxPlayTime);

        return isWithinPlayerRange && isWithinTimeRange;
      });
    },

    async fetchGroupDetails() {
      const groupId = this.$route.params.groupId;
      this.loading = true;
      try {
        const response = await axios.get(`http://localhost:3000/group/${groupId}/details`);
        const data = response.data;
        this.groupName = data.name;
        this.owner = data.owner;
        this.members = data.members;
        this.games = data.games;
        this.isMemberOrOwner = this.members.some(member => member.id === this.userId) || this.owner?.id === this.userId;
        this.applyFilters();
      } catch (error) {
        console.error(error);
        this.error = 'An error occurred while fetching group details.';
      } finally {
        this.loading = false;
      }
    },

    async fetchCurrentUserId() {
      try {
        const response = await axios.get('http://localhost:3000/current-user', { withCredentials: true });
        this.userId = response.data.userId;
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    },

    async deleteGroup() {
      const groupId = this.$route.params.groupId;
      try {
        const response = await axios.delete(`http://localhost:3000/delete-group/${groupId}`, { withCredentials: true });
        console.log(response.data); 
        this.$router.push('/groups');
      } catch (error) {
        console.error('Error deleting group:', error.response.data);
      }
    },

    async removeMember(memberId) {
      const groupId = this.$route.params.groupId;
      try {
        await axios.post(`http://localhost:3000/group/${groupId}/remove-member`, { 
          userId: memberId, 
          requestingUserId: this.userId
        });
        this.members = this.members.filter(member => member.id !== memberId);
        await this.fetchGroupDetails();
      } catch (error) {
        this.error = 'An error occurred while removing user from group.';
      }
    },

    toggleManageMode() {
      this.manageMode = !this.manageMode;
    },
  }
};
</script>

<style scoped>
.column-background.main-content {
  margin-left: 2.5rem;
  border-radius: 5px;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 10px;
  margin-bottom: 3rem;
}


.manage-group-button {
  background-color: #4e4c67;
  color: #fff;
  border: 1px solid #6e6c81;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-top: 10px;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.manage-group-button:hover {
  background-color: #5e5c71;
  border-color: #7e7c91;
}

.delete-group-button {
  margin-right: 10px;
  margin-top: 10px;
  padding: 10px 15px;
  color: white;
  border: 2px solid #474747;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease-in-out;
  font-size: 16px;
  font-weight: bold;
  background-color: #e53935;
}

.delete-group-button:hover {
  background-color: #7a1f1c;
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

.friends-list {
  list-style-type: none;
  padding: 0;
  gap: 1rem;
}

.member-container {
  display: flex;
  align-items: center;
}

.owner {
  height: 25px;
  width: 25px;
  margin-right: 5px;
}

.remove {
  height: 50px;
  width: 50px;
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
  display: flex;
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

.remove-member-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  padding: 0;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.group-games {
  margin-top: 20px;
}

.games-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
}

.games-header h4 {
  flex-shrink: 0;
  margin-right: 2rem;
}

.filters {
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-grow: 1;
  color: #e2e2e2;
}

.filters input {
  padding: 3px 5px;
  font-size: 12px;
  height: 30px;
  color: #e2e2e2;
}

.filters input {
  width: 160px !important;
}

/* Adjust layout for smaller screens */
@media (max-width: 767px) {
  .games-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    width: 100%;
    margin-top: 10px;
    justify-content: start; /* Align filters to the start */
  }
}

</style>