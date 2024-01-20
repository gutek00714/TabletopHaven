<template>
    <div>
      <img :src="gameData.image" alt="Game image" width="200" height="150" />
      <h2>{{ gameData.name && gameData.name.length > 0 ? gameData.name[0]._ : '' }}</h2>
      <p v-html="gameData.description"> </p>
      <ul>
        <li>Czas gry: {{ gameData.playingtime }} minut</li>
        <li>Od lat: {{ gameData.age }}</li>
      </ul>
      <button @click="addToShelf">Dodaj do półki</button>
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
  