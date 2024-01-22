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
        <h2 style="color: white;">{{ gameData.name }}</h2>
        <div style="display: flex; justify-content: space-around; width: 100%; color: white;">
          <div style="padding-right: 10px;">Players: {{ gameData.min_players }} - {{ gameData.max_players }}</div>
          <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Playing time: {{ gameData.play_time }} minutes</div>
          <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Age: {{ gameData.age }}</div>
          <div v-if="averageRating !== null" style="border-left: 1px solid white; padding-left: 10px;">Rating: {{ averageRating.toFixed(1) }}</div>
        </div>
      </div>
    </div>
    <button @click="addToShelf" class="waves-effect waves-light btn" style="white-space: nowrap; display: flex; justify-content: center; margin-top: 20px;">Add to your shelf</button>
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

    addToShelf() {
      // Add button logic
    },
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
