<!-- GameDetails.vue -->
<template>
  <div class="col m9 column-background main-content"> 
    <div style="display: flex; flex-direction: row; justify-content: flex-start;">
      <!-- style="background-color: var(--background-color);" - option to change color in the future -->
      <img :src="gameData.image" alt="Game image" width="200" height="200" />
      <div style="margin-left: 20px;">
        <h2 style="color: white;">{{ gameData.name && gameData.name.length > 0 ? gameData.name[0]._ : '' }}</h2>
        <div style="display: flex; justify-content: space-around; width: 100%; color: white;">
          <div>Number of Players: {{ gameData.minplayers }} - {{ gameData.maxplayers }}</div>
          <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Playing time: {{ gameData.playingtime }} minutes</div>
          <div style="border-left: 1px solid white; padding-left: 10px;">Age: {{ gameData.age }}</div>
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
  data() {
    return {
      gameData: {},
    };
  },
  async created() {
    const response = await axios.get('http://localhost:3000/details/27627');
    this.gameData = response.data.boardgames.boardgame;
  },
  methods: {
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
    /* --background-color: #242730; */
}
</style>
