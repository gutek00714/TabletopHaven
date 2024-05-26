<template>
  <div class="col m11 column-background ">
    <div class="section">
      <h4>News</h4>
      <div class="carousel">
        <a class="carousel-item" href="#one!"><img src="/image1.jpg"></a>
        <a class="carousel-item" href="#two!"><img src="/image2.jpg"></a>
        <a class="carousel-item" href="#three!"><img src="/image3.jpg"></a>
        <a class="carousel-item" href="#four!"><img src="/image4.jpg"></a>
      </div>
    </div>
    <div class="section">
      <h4>Top 5</h4>
      <div class="row">
        <GameCard v-for="item in backendItems" :key="item.id" :gameId="item.id" class="game-card col m2" />
      </div>
    </div>
  </div>
</template>

<script>
/* global M */
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
  mounted() {
    this.initializeCarousel();
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
    initializeCarousel() {
      var elems = document.querySelectorAll('.carousel');
      M.Carousel.init(elems);
    },
  },
}
</script>

<style scoped>
.column-background.main-content {
  margin-left: 2.5rem;
  border-radius: 5px;
}

.game-card {
  margin: 33px;
  margin-top: 0.5rem;
}

.carousel {
  width: 100%;
  height: 400px; 
}

.carousel-item {
  width: 800px !important;
  height: 400px !important;
  border-radius: 10px !important;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
