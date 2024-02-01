<template>
  <div class="categories-container">
    <h3>Game Categories</h3>
    <div class="categories-list">
      <router-link 
        class="category-item" 
        v-for="category in categories" 
        :key="category" 
        :to="{ name: 'GamesByCategory', params: { category: category }}">
        {{ category }}
      </router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      categories: []
    };
  },
  async created() {
    await this.fetchCategories();
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await axios.get('http://localhost:3000/categories');
        this.categories = response.data;
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    },
  },
}
</script>
<style scoped>
.categories-container {
  padding: 2rem;
  color: #FFF;
  background-color: #1f1d2b;
  margin-left: 250px;
  border-radius: 10px;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
}

.category-item {
  margin: 0.5rem;
  padding: 0.5rem;
  border-radius: 10px;
  background-color: #272538;
  transition: all 0.3s ease;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  color: #FFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100px;
  width: 200px;
  overflow: hidden; 
}

.category-item:hover {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

</style>
