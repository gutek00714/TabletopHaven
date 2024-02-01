<template>
  <div class="games-container">
    <h3>Games in Category: {{ $route.params.category }}</h3>
    <div class="games-list">
    <GameCard v-for="game in games" :key="game.id" :gameId="game.id" />
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
    games: []
    };
},
async created() {
    await this.fetchGamesByCategory();
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
.games-container {
    padding: 2rem;
    color: #FFF;
    background-color: #1f1d2b;
    margin-left: 250px;
    border-radius: 10px;
  }
  
  .games-list {
    display: flex;
    flex-wrap: wrap;
    padding: 0;
    justify-content: flex-start;
    gap: 1rem;
  }
</style>