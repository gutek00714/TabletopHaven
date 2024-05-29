<template>
  <router-link :to="`/game/${gameId}`" class="router-link">
    <div v-if="loading" class="game-card-small">
      Loading...
    </div>
    <div v-else-if="error" class="game-card-small">
      Error: {{ error }}
    </div>
    <div v-else class="game-card-small">
      <div class="game-image-container-small">
        <img :src="gameData.image" alt="Game image" class="game-image-small" />
      </div>
      <h2 class="game-title-small">{{ gameData.name }}</h2>
      <h3 class="game-year-small">({{ gameData.year }})</h3>
    </div>
  </router-link>
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
        const response = await axios.get(`http://localhost:3000/game/${this.gameId}`);
        this.gameData = response.data;
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

    adjustFontSize(title) {
      if (title.length > 16) { // Adjust the number based on your needs
        return '24px'; // Smaller font size for longer titles
      }
      else if (title.length > 19) {
        return '20px';
      }
      else if (title.length > 23) {
        return '16px';
      }
      return '30px';
    },
  },
};
</script>

<style scoped>
.router-link {
  text-decoration: none;
  color: #FFF;
}

.game-card-small {
  height: 200px; /* Smaller height */
  width: 180px; /* Smaller width */
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  word-wrap: break-word;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
}

.game-card-small:hover {
  background-color: #322f46;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.6);
  transform: translateY(-2px);
}

.game-image-container-small {
  width: 150px; /* Smaller image width */
  height: 150px; /* Smaller image height */
  display: flex;
  padding-top: 1rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.game-card-small img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.game-title-small {
  font-size: 20px; /* Smaller font size */
  margin-top: 0.5rem;
  margin-bottom: 2px;
}

.game-year-small {
  font-size: 16px; /* Smaller font size for year */
  margin-top: 0;
}
</style>
