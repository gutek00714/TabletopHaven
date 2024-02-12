<template>
  <div class="shelf-container">
    <div v-if="loading" class="loading-error">Loading your shelf...</div>
    <div v-else-if="error" class="loading-error">{{ error }}</div>
    <div v-else-if="showShelf">
      <div class="profile-header">
        <img :src="profileImageUrl" alt="Profile Image" class="profile-image">
        <h2 class="shelf-title">{{ userName }}'s Shelf</h2>
      </div>
      <section class="owned-games">
        <h3 class="section-title">Owned Games</h3>
        <div v-if="ownedGames.length > 0" class="games-grid">
          <GameCard v-for="game in ownedGames" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
        <div v-else class="no-games-message">You have no games in your shelf.</div>
      </section>
      <section class="wishlist">
        <h3 class="section-title">Wishlist</h3>
        <div v-if="wishlist.length > 0" class="games-grid">
          <GameCard v-for="game in wishlist" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
        <div v-else class="no-games-message">Your wishlist is empty.</div>
      </section>
      <section class="favorites">
        <h3 class="section-title">Favorites</h3>
        <div v-if="favorites.length > 0" class="games-grid">
          <GameCard v-for="game in favorites" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
        <div v-else class="no-games-message">You have no favorites yet.</div>
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import GameCard from './SmallGameCard.vue';

export default {
  components: {
    GameCard
  },
  data() {
    return {
      userName: 'Guest', // Default username
      ownedGames: [],
      wishlist: [],
      favorites: [],
      loading: false,
      error: null,
      isAuthenticated: false, // To track authentication status
      profileImageUrl: '',
    };
  },
  async created() {
    await this.fetchUserShelf();
  },
  computed: {
    showShelf() {
      return this.isAuthenticated && !this.error;
    },
  },
  methods: {
    async fetchUserShelf() {
      this.loading = true;
      try {
        const response = await axios.get('http://localhost:3000/user-shelf', { withCredentials: true });
        this.isAuthenticated = true;
        this.userName = response.data.username;
        this.ownedGames = response.data.ownedGames;
        this.wishlist = response.data.wishlist;
        this.favorites = response.data.favorites;
        this.profileImageUrl = response.data.profileImageUrl;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.isAuthenticated = false;
          this.error = error.response.data.message; // Use the server-sent message
        } else {
          this.error = 'An error occurred while fetching your shelf.';
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.shelf-container {
  padding-top: 5rem;
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

@media (max-width: 768px) {
  .shelf-container {
    margin-left: 1rem;
  }
}
</style>