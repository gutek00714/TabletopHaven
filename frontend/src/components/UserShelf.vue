<template>
  <div class="user-profile-container">
    <div v-if="loading" class="loading-error">Loading user profile...</div>
    <div v-else-if="error" class="loading-error">{{ error }}</div>
    <div v-else>
      <div class="profile-header">
        <img :src="userProfile.profileImageUrl" alt="Profile Image" class="profile-image">
        <h2 class="shelf-title">{{ userProfile.username }}'s Shelf</h2>
        <button @click="toggleFollow" :class="{ 'btn-follow': !isFollowing, 'btn-unfollow': isFollowing }">
          {{ isFollowing ? 'Unfollow' : 'Follow' }} 
        </button>
      </div>
      <div class="user-shelf">
        <section class="owned-games">
          <h3 class="section-title">Owned Games</h3>
          <div v-if="userProfile.ownedGames.length > 0" class="games-grid">
            <GameCard v-for="game in userProfile.ownedGames" :key="game.id" :gameId="game.id" class="game-card" />
          </div>
          <div v-else class="no-games-message">{{ userProfile.username }} has no games shelf.</div>
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
      loading: false,
      error: null,
    };
  },
  async created() {
    await this.fetchUserProfile();
  },
  methods: {
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
        const followCheckResponse = await axios.get(`http://localhost:3000/is-following/${this.userId}`, { withCredentials: true });
      this.isFollowing = followCheckResponse.data.isFollowing;

      } catch (error) {
        console.error('Error fetching user profile:', error);
        this.error = error.message || "An error occurred";
      } finally {
        this.loading = false;
      }
    },

    processGameList(gameList) {
      return gameList.map(gameId => {
        return { id: gameId };
      });
    },

    async toggleFollow() {
      try {
        if (this.isFollowing) {
          await axios.post('http://localhost:3000/remove-friend', { friendId: this.userId }, { withCredentials: true });
          this.isFollowing = false;
          alert(`You have unfollowed ${this.userProfile.username}.`);
        } else {
          await axios.post('http://localhost:3000/add-friend', { friendId: this.userId }, { withCredentials: true });
          this.isFollowing = true;
          alert(`You are now following ${this.userProfile.username}.`);
        }
        // You may also consider re-fetching the user profile here to ensure all data is up-to-date
        // await this.fetchUserProfile();
      } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Failed to update follow status');
      }
    },
  }
};
</script>

<style scoped>
.user-profile-container {
  margin-left: 330px;
  padding-top: 3rem;
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
  color: #1f1d2b;
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

@media (max-width: 768px) {
  .shelf-container {
    margin-left: 1rem;
  }
}
</style>
