<template>
    <div class="col m9 column-background main-content">
      <div class="main-site">
        <!-- Main site content here -->
        <div class="section white-text">
          <h5>News</h5>
          <div class="col m6">dupa</div>
          <div class="col m6">dupa1</div>
        </div>
        <div class="divider"></div>
        <div class="section white-text">
          <h5>Top 5</h5>
          <GameCard v-for="item in backendItems" :key="item.id" :gameId="item.id" class="game-card col m2" />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import GameCard from './GameCard.vue';
  
  export default {
    name: 'RightContent',
    components: {
      GameCard,
    },
    data() {
      return {
        backendItems: [
          { id: 1, name: 'Placeholder1' },
          { id: 2, name: 'Placeholder2' },
          { id: 3, name: 'Placeholder3' },
          { id: 4, name: 'Placeholder4' },
          { id: 5, name: 'Placeholder5' }
        ]
      };
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
    margin: 47px;
  }
  </style>
  