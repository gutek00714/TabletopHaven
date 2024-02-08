<template>
  <div class="shelf-container">
    <div v-if="loading">Loading your shelf...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="showShelf">
      <div class="profile-header">
        <img :src="profileImageUrl" alt="Profile Image" class="profile-image">
        <h2 class="shelf-title">{{ userName }}'s Shelf</h2>
      </div>
      <section class="owned-games">
        <h3 class="section-title">Owned Games</h3>
        <div class="games-grid">
          <GameCard v-for="game in ownedGames" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
      </section>
      <section class="wishlist">
        <h3 class="section-title">Wishlist</h3>
        <div class="games-grid">
          <GameCard v-for="game in wishlist" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
      </section>
      <section class="favorites">
        <h3 class="section-title">Favorites</h3>
        <div class="games-grid">
          <GameCard v-for="game in favorites" :key="game.id" :gameId="game.id" class="game-card" />
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import GameCard from './GameCard.vue';

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
  margin-left: 250px; /* Adjust this value to match the actual width of your menu */
  padding-top: 1rem;
}

.shelf-title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: white;
  margin-left: 20px;
}

.section-title {
  font-size: 1.5rem;
  color: white;
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

@media (max-width: 768px) {
  .shelf-container {
    margin-left: 1rem;
  }
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
.profile-image {
  width: 75px;
  height: 75;
  border-radius: 50%;
  object-fit: cover;
}
</style>
