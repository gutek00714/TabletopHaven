<template>
  <div class="col m11 column-background">
    <div class="section">
      <h4>Games in Category: {{ $route.params.category }}</h4>
      <input v-model="gameSearchQuery" type="text" placeholder="Search games" class="search-games-container white-text">
      <div class="games-list">
        <GameCard v-for="game in filteredGamesList" :key="game.id" :gameId="game.id" />
      </div>
    </div>
  </div>
</template>
  
  
<script>
import GameCard from './GameCard.vue';
import axios from 'axios';

export default {
components: { GameCard },
data() {
  return {
    games: [],
    gameSearchQuery: '',
  };
},
async created() {
    await this.fetchGamesByCategory();
},

computed: {
  filteredGamesList() {
      if (!this.gameSearchQuery) {
        return this.games;
      }
      return this.games.filter(game =>
        game.name.toLowerCase().includes(this.gameSearchQuery.toLowerCase())
      );
    }
  },

  methods: {
      async fetchGamesByCategory() {
      try {
          const response = await axios.get(`http://localhost:3000/games/category/${this.$route.params.category}`);
          this.games = response.data;
      } catch (error) {
          console.error("Error fetching games:", error);
      }
      },
  },
}
</script>

<style scoped>
.games-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  justify-content: flex-start;
  gap: 1rem;
}

.search-games-container {
  width: 35% !important;
}
</style>