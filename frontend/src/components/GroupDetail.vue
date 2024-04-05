<template>
  <div class="col m11 column-background">
    <div class="section">
      <div v-if="loading" class="loading-error">Loading group details...</div>
      <div v-else-if="error" class="loading-error">{{ error }}</div>
      <div v-else>
        <div v-if="isMemberOrOwner">
          <div class="row">
            <div class="group-members-and-chat">            
              <div class="group-header">
                <h4>{{ groupName }}</h4>
                <div v-if="isOwner">
                  <button @click="toggleManageMode" class="manage-group-button">
                    {{ manageMode ? 'Exit Manage Mode' : 'Manage Group' }}
                  </button>
                </div>
                <div v-if="manageMode" class="delete-group">
                  <button @click="openDeleteGroupModal" class="delete-group-button">Delete Group</button>
                </div>
              </div>  
              <div id="confirmDeleteGroupModal" class="modal" ref="deleteModal">
                <div class="modal-content">
                  <h4>Confirm Delete</h4>
                  <p>Are you sure you want to delete group {{ groupName }}?</p>
                </div>
                <div class="modal-footer">
                  <a href="#!" class="modal-close waves-effect waves-green btn-flat" @click="confirmDeleteGroup">Yes</a>
                  <a href="#!" class="modal-close waves-effect waves-red btn-flat">No</a>
                </div>
              </div>
              <div id="confirmRemoveMemberModal" class="modal" ref="removeModal">
                <div class="modal-content">
                  <h4>Confirm Member Removal</h4>
                  <p v-if="memberToRemove">Are you sure you want to remove {{ memberToRemove.username }} from the group?</p>
                </div>
                <div class="modal-footer">
                  <a href="#!" class="modal-close waves-effect waves-green btn-flat" @click="confirmRemoveMember">Yes</a>
                  <a href="#!" class="modal-close waves-effect waves-red btn-flat">No</a>
                </div>
              </div>              
              <div class="row">
                <div class="col m5">
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
                        <button v-if="manageMode && !member.is_owner" @click.stop="openRemoveMemberModal(member)" class="remove-member-button">
                          <img class="remove" src="/remove.svg" alt="X"/>
                        </button>           
                      </div>
                    </li>
                  </ul>
                </div>

                <div class="col m7">
                  <h4>Group Chat</h4>
                  <div class="chat-container">
                    <div class="messages-container">
                      <div v-for="msg in messages" :key="msg.id" class="message">
                        <strong>{{ msg.username }}</strong>: {{ msg.message }}
                      </div>
                    </div>
                    <div class="chat-message-input-container">
                      <input v-model="message" @keyup.enter="sendMessage" placeholder="Type a message..." class="message-input">
                      <button @click="sendMessage" class="send-message-button">Send</button>
                    </div>
                  </div>
                </div>                
              </div>
            </div>
          </div>

          <div class="row">
            <section class="group-games">
              <h4>Games Owned by Group</h4>
              <div class="filters">
                <input type="number" v-model.number="playersFilterComputed" placeholder="Number of Players">
                <input type="number" v-model.number="minPlayTimeFilter" placeholder="Min Play Time">
                <input type="number" v-model.number="maxPlayTimeFilter" placeholder="Max Play Time">
              </div>
              <ul class="game-list">
                <GameCard v-for="game in filteredGames" :key="game.id" :gameId="game.id"/>
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
import io from 'socket.io-client';
const socket = io('http://localhost:3000');

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
      memberToRemove: null,
      deleteModalInstance: null,
      removeModalInstance: null,
      messages: [],
      message: ''
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
    try {
      await this.fetchCurrentUserId();
      await this.fetchGroupDetails();
    } catch (error) {
      console.error('Error in created hook:', error);
    }
    socket.emit('joinGroup', this.$route.params.groupId, this.userId);

    socket.on('chatHistory', (messages) => {
      this.messages = messages;
    });

    socket.on('receiveMessage', (messageObject) => {
      this.messages.push(messageObject);
    });
  },

  computed: {
    isOwner() {
      return this.owner?.id === this.userId;
    },
    playersFilterComputed: {
      get() {
        return this.playersFilter;
      },
      set(value) {
        this.playersFilter = value === '' ? null : Number(value);
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      const elems = document.querySelectorAll('.modal');
      // eslint-disable-next-line
      M.Modal.init(elems);
    });
  },

  methods: {
    sendMessage() {
      if (!this.message.trim()) return; // Prevent sending empty messages

      socket.emit('sendMessage', this.message, this.$route.params.groupId, this.userId);
      this.message = ''; // Clear the message input after sending
    },


    async applyFilters() {
      const invalidTimeFilter = this.minPlayTimeFilter !== null && this.maxPlayTimeFilter !== null && 
                                this.minPlayTimeFilter > this.maxPlayTimeFilter;

      if (invalidTimeFilter) {
        this.filteredGames = [];
        return;
      }
      this.filteredGames = this.games.filter(game => {
        const isWithinPlayerRange = this.playersFilter === null || this.playersFilter === undefined || 
                                    (game.min_players <= this.playersFilter && game.max_players >= this.playersFilter);

        const minPlayTime = this.minPlayTimeFilter || -Infinity;
        const maxPlayTime = this.maxPlayTimeFilter || Infinity;

        const isWithinTimeRange = (game.play_time >= minPlayTime) && (game.play_time <= maxPlayTime);

        return isWithinPlayerRange && isWithinTimeRange;
      });
    },

    async fetchGroupDetails() {
      if (!this.userId) {
        return;
      }
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

    openDeleteGroupModal() {
      const modalElement = this.$refs.deleteModal;
      // eslint-disable-next-line
      this.deleteModalInstance = M.Modal.init(modalElement); // Save the instance
      this.deleteModalInstance.open();
    },

    async confirmDeleteGroup() {
      const groupId = this.$route.params.groupId;
      try {
        await axios.delete(`http://localhost:3000/delete-group/${groupId}`, { withCredentials: true });
        this.$router.push('/groups');
      } catch (error) {
        console.error('Error deleting group:', error.response.data);
      } finally {
        if (this.deleteModalInstance) { // Check if the instance is available
          this.deleteModalInstance.close(); // Use the saved instance to close the modal
        }
      }
    },

    openRemoveMemberModal(member) {
      if (member) {
        this.memberToRemove = member;
        const modalElement = this.$refs.removeModal;
        // eslint-disable-next-line
        this.removeModalInstance = M.Modal.init(modalElement); // Save the instance
        this.removeModalInstance.open();
      } else {
        // Handle the case where the member is not defined
        console.error('No member selected for removal.');
      }
    },

    async confirmRemoveMember() {
      if (!this.memberToRemove) return;
      const groupId = this.$route.params.groupId;
      try {
        await axios.post(`http://localhost:3000/group/${groupId}/remove-member`, {
          userId: this.memberToRemove.id,
          requestingUserId: this.userId
        });
        this.members = this.members.filter(member => member.id !== this.memberToRemove.id);
        // eslint-disable-next-line
        M.toast({ html: `${this.memberToRemove.username} has been removed from the group.`, displayLength: 4000});
        this.memberToRemove = null; // Reset memberToRemove here before closing the modal
      } catch (error) {
        this.error = 'An error occurred while removing user from group.';
        console.error('Error removing member:', error.response.data);
        // eslint-disable-next-line
        M.toast({ html: 'Failed to remove member from the group.', displayLength: 4000});
      } finally {
        // Close the modal after the action or on error
        if (this.removeModalInstance) { // Check if the instance is available
          this.removeModalInstance.close(); // Use the saved instance to close the modal
        }
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

.modal {
  background-color: #2b2d42;
  border-radius: 8px;
}

.modal-content {
  color: #ffffff;
  padding: 20px;
}

.modal-footer {
  background-color: #212136 !important;
  border-top: 1px solid #42445a !important;
  padding: 12px 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-footer .modal-close:first-child {
  margin-right: 1rem;
}

.modal-close {
  color: #FFFFFF;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  line-height: normal;
  padding: 0 1rem;
  margin: 0 10px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  text-transform: uppercase;
  font-weight: bold;
}

.modal-close.waves-effect {
  display: inline-block;
  padding: 10px 25px;
  margin: 0 5px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.modal-close.waves-green {
  background-color: #4caf50;
}

.modal-close.waves-red {
  background-color: #e53935;
}

.modal-close:hover {
  transition: all 0.3s ease-in-out;
  background-color: #5c5c5c;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.chat-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 400px;
}

.chat-message-input-container {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.message-input {
  flex-grow: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
  margin: 0;
  color: #FAFAFA;
}

.send-message-button {
  padding: 0.5rem 1rem;
  background-color: #4e4c67;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
  box-sizing: border-box;
  font-size: 1rem;
}

.send-message-button:hover {
  background-color: #5e5c71;
}

.message {
  padding: 0.5rem;
  background-color: #2f2c3d; /* Default background for all messages */
}

.message:nth-child(even) {
  background-color: #272538; /* Alternate background for messages */
}

/* Add a max-width to the chat input and button container to prevent stretching on larger screens */
.chat-message-input-container {
  max-width: 100%;
}

/* You might need to adjust the container of the messages to allow for scrolling */
.messages-container {
  flex-grow: 1;
  overflow-y: auto;
}

</style>