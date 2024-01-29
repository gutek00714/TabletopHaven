<template>
  <div class="col m9 column-background main-content">
    <div class="main-site">
      <!-- Main site content here -->
      <div class="section white-text">
        <h4>News</h4>
          <div class="news-content">
            <div class="col m6">dupa</div>
            <div class="col m6">dupa1</div>
          </div>
      </div>
      <div class="divider"></div>
      <div class="section white-text">
        <h4>Top 5</h4>
        <div class="row">
          <GameCard v-for="item in backendItems" :key="item.id" :gameId="item.id" class="game-card col m2" />
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import GameCard from './GameCard.vue';
import axios from 'axios';

export default {
  name: 'RightContent',
  components: {
    GameCard,
  },
  data() {
    return {
      backendItems: []
    };
  },
  async created() {
    await this.fetchTopGames();
  },
  methods: {
    async fetchTopGames() {
      try {
        const response = await axios.get('http://localhost:3000/top-games');
        this.backendItems = response.data;
      } catch (error) {
        console.error("Error fetching top games:", error);
        // Optionally handle the error, e.g., by showing a message to the user
      }
    },
  },
}
</script>


<style scoped>
.column-background.main-content {
  margin-left: 2.5rem;
  margin-top: 3rem;
  border-radius: 5px;
}

.game-card {
  margin: 33px;
  margin-top: 0.5rem;
}

.news-content {
  margin-top: 2rem;
}
</style>
