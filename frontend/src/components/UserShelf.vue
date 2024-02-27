<template>
  <div class="user-profile-container">
    <div v-if="loading" class="loading-error">Loading user profile...</div>
    <div v-else-if="error" class="loading-error">{{ error }}</div>
    <div v-else>
      <div class="profile-header">
        <img :src="userProfile.profileImageUrl" alt="Profile Image" class="profile-image">
        <h2 class="shelf-title">{{ userProfile.username }}'s Shelf</h2>
        <button v-if="isLoggedIn && userId !== loggedInUserId" @click="toggleFollow" :class="{ 'btn-follow': !isFollowing, 'btn-unfollow': isFollowing }">
          {{ isFollowing ? 'Unfollow' : 'Follow' }} 
        </button>
        <button v-if="isLoggedIn && userId !== loggedInUserId" @click="extendGroups" class="btn-add-to-group">
          Add to Group
        </button>
      </div>
      <div class="user-shelf">
        <div class="row">
          <section class="add-group">
            <div v-if="showGroups">
              <h3 class="section-title">Which group?</h3>
              <div v-for="group in groups" :key="group.id" class="group-card col m2" @click="addToGroup(group.id)">
                <div class="group-item">
                  <div class="group-name">{{ group.name }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
        <section class="owned-games">
          <h3 class="section-title">Owned Games</h3>
          <div v-if="userProfile.ownedGames.length > 0" class="games-grid">
            <GameCard v-for="game in userProfile.ownedGames" :key="game.id" :gameId="game.id" class="game-card" />
          </div>
          <div v-else class="no-games-message">{{ userProfile.username }} has no games in shelf.</div>
        </section>
        <section class="wishlist">
          <h3 class="section-title">Wishlist</h3>
          <div v-if="userProfile.wishlist.length > 0" class="games-grid">
            <GameCard v-for="game in userProfile.wishlist" :key="game.id" :gameId="game.id" class="game-card" />
          </div>
          <div v-else class="no-games-message">{{ userProfile.username }} has no games in wishlist.</div>
        </section>
        <section class="favorites">
          <h3 class="section-title">Favorites</h3>
          <div v-if="userProfile.favorites.length > 0" class="games-grid">
            <GameCard v-for="game in userProfile.favorites" :key="game.id" :gameId="game.id" class="game-card" />
          </div>
          <div v-else class="no-games-message">{{ userProfile.username }} has no favorite games.</div>
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
      userProfile: {
        username: 'Guest',
        profileImageUrl: '',
        ownedGames: [],
        wishlist: [],
        favorites: [],
      },
      isFollowing: false,
      isLoggedIn: false,
      loading: false,
      error: null,
      showGroups: false
    };
  },
  async created() {
    await this.checkLoginStatus();
    await this.fetchUserProfile();
    await this.fetchUserGroups();
  },
  methods: {
    async checkLoginStatus() {
      try {
        const response = await axios.get('http://localhost:3000/check-login-status', { withCredentials: true });
        this.isLoggedIn = response.data.isLoggedIn;
      } catch (error) {
        console.error('Error checking login status:', error);
        this.isLoggedIn = false;
      }
    },
    async fetchUserProfile() {
      this.loading = true;
      try {
        const response = await axios.get(`http://localhost:3000/user/${this.userId}`);
        this.userProfile.username = response.data.username;
        this.userProfile.profileImageUrl = response.data.profile_image_url;
        this.userProfile.ownedGames = this.processGameList(response.data.owned_games);
        this.userProfile.wishlist = this.processGameList(response.data.wishlist);
        this.userProfile.favorites = this.processGameList(response.data.favorites);
        this.error = null;
        if (this.isLoggedIn) {
          try {
            const followCheckResponse = await axios.get(`http://localhost:3000/is-following/${this.userId}`, { withCredentials: true });
            this.isFollowing = followCheckResponse.data.isFollowing;
          } catch (error) {
            console.error('Error checking following status:', error);
          }
        } else {
          this.isFollowing = false;
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        this.error = error.message || "An error occurred";
      } finally {
        this.loading = false;
      }
    },

    processGameList(gameList) {
      if (!gameList) {
        return [];
      }
      return gameList.map(gameId => {
        return { id: gameId };
      });
    },

    async toggleFollow() {
      try {
        let response;
        if (this.isFollowing) {
          response = await axios.post('http://localhost:3000/remove-friend', { friendId: this.userId }, { withCredentials: true });
        } else {
          response = await axios.post('http://localhost:3000/add-friend', { friendId: this.userId }, { withCredentials: true });
        }

        if (response.status === 200) {
          this.isFollowing = !this.isFollowing;
          const action = this.isFollowing ? 'following' : 'unfollowing';
          alert(`You are now ${action} ${this.userProfile.username}.`);
        } else {
          throw new Error(response.data.message || 'Failed to update follow status');
        }
      } catch (error) {
        if (error.response) {
          alert(error.response.data || 'Failed to update follow status');
        } else {
          console.error('Error toggling follow:', error);
          alert('Failed to update follow status');
        }
      }
    },
    async extendGroups() {
      this.showGroups = true;
    },
    
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

    async addToGroup(groupId) {
      try {
        let response = await axios.post(`http://localhost:3000/group/${groupId}/add-member`, { userId: this.userId }, { withCredentials: true });

        if (response.status === 200) {
          alert(`User ${this.userProfile.username} has been added to the group.`);
        } else {
          throw new Error(response.data.message || 'Failed to add user to the group');
        }
      } catch (error) {
        if (error.response) {
          alert(error.response.data || 'Failed to add user to the group');
        } else {
          console.error('Error adding user to group:', error);
          alert('Failed to add user to the group');
        }
      }
    },
  }
};
</script>

<style scoped>
.group-card {
  cursor: pointer;
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
.user-profile-container {
  padding-top: 1.5rem;
  padding-right: 2rem;
}

.centered-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Adjust this value as needed */
  overflow-y: auto; /* Enable scrolling if content overflows */
}
.shelf-title, .section-title {
  color: white;
}

.shelf-title {
  margin: 0;
  padding: 0;
  font-size: 2rem;
  margin-left: 20px;
}

.section-title {
  font-size: 1.5rem;
}

.section {
  margin-bottom: 2rem;
  padding-left: 20px;
}

.games-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.game-card {
  margin-bottom: 10px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-image {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  object-fit: cover;
}

.loading-error {
  font-size: 1.5rem;
  color: white;
  text-align: center;
  margin-top: 2rem;
}

.no-games-message {
  color: #9e9696;
  font-size: 1.2rem;
  margin-top: 1rem;
}

.btn-follow, .btn-unfollow {
  margin-right: 10px;
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
}
.btn-follow:hover, .btn-unfollow:hover {
  color: #e2e2e2;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.btn-follow {
  background-color: #4caf50;
}

.btn-follow:hover {
  background-color: #2c612f;
}

.btn-unfollow {
  background-color: #e53935;
}

.btn-unfollow:hover {
  background-color: #7a1f1c;
}

.btn-add-to-group {
  background-color: #4e6ef2;
  margin-right: 10px;
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
}

.btn-add-to-group:hover {
  background-color: #3b56c1;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}


@media (max-width: 768px) {
  .shelf-container {
    margin-left: 1rem;
  }
}
</style>
