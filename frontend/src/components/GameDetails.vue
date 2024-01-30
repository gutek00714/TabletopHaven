<!-- GameDetails.vue -->
<template>
  <div v-if="loading" class="column-background main-content">
    Loading game details...
  </div>
  <div v-else-if="error" class="column-background main-content">
    Error loading game details: {{ error }}
  </div>
  <div v-else class="col m9 column-background main-content">
    <div style="display: flex; flex-direction: row; justify-content: flex-start;">
      <img :src="gameData.image" alt="Game image" width="200" height="200" />
      <div style="margin-left: 20px;">
        <h2 style="color: white;">{{ gameData.name }} ({{ gameData.year}})</h2>
        <div style="display: flex; width: 100%; color: white;">
          <div style="padding-right: 10px;">Players: {{ gameData.min_players }} - {{ gameData.max_players }}</div>
          <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Playing time: {{ gameData.play_time }} minutes</div>
          <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Age: {{ gameData.age }}</div>
          <div v-if="averageRating !== null" style="border-left: 1px solid white; padding-left: 10px;">Rating: {{ averageRating.toFixed(1) }}</div>
        </div>
      </div>
    </div>
      <button @click="addToShelf" class="waves-effect waves-light btn" style="white-space: nowrap; display: flex; justify-content: center; margin-top: 20px;">
        {{ isGameInShelf ? 'Remove from your shelf' : 'Add to your shelf' }}
      </button>
    <div>
      <p v-html="gameData.description" style="color: white;"> </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: {
    gameId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      gameData: {},
      isGameInShelf: false,
      loading: false,
      error: null,
      averageRating: null,
    };
  },
  async created() {
    this.fetchGameData();
  },
  methods: {
    async fetchGameData() {
      this.loading = true;
      try {
        const response = await axios.get(`http://localhost:3000/game/${this.gameId}`, { withCredentials: true });
        this.gameData = response.data;

        // Check if owned_games exists and includes the current game
        this.isGameInShelf = response.data.owned_games ? response.data.owned_games.includes(this.gameId) : false;

        this.calculateAverageRating();
        this.error = null;
      } catch (error) {
        console.error("Error fetching game data:", error);
        this.error = error.message || "An error occurred";
      } finally {
        this.loading = false;
      }
    },

    calculateAverageRating() {
      if (this.gameData.rating && this.gameData.rating.length > 0) {
        const sum = this.gameData.rating.reduce((a, b) => a + b, 0);
        this.averageRating = sum / this.gameData.rating.length;
      } else {
        this.averageRating = null;
      }
    },

    async addToShelf() {
      if (!this.isGameInShelf) {
        try {
          await axios.post('http://localhost:3000/add-to-shelf', { gameId: this.gameId }, { withCredentials: true });
          this.isGameInShelf = true;
          alert('Game added to your shelf!');
        } catch (error) {
          console.error('Error adding game to shelf:', error);
          alert('Failed to add game to shelf');
        }
      } else {
        this.removeFromShelf();
      }
    },

    async removeFromShelf() {
      try {
        await axios.post('http://localhost:3000/remove-from-shelf', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInShelf = false;
        alert('Game removed from your shelf!');
      } catch (error) {
        console.error('Error removing game from shelf:', error);
        alert('Failed to remove game from shelf');
      }
    }
  },
};
</script>

<style scoped>
.column-background.main-content {
    margin-left: 2.5rem;
    margin-top: 5rem;
    border-radius: 5px;
    /* Background color can be set here if needed */
}
</style>
