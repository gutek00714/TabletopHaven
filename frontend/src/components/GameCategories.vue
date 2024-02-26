<template>
  <div class="col m11 column-background">
    <div class="section">
      <h4>Game Categories</h4>
      <input v-model="categorySearchQuery" type="text" placeholder="Search categories" class="search-categories-container white-text">
      <div class="categories-list">
        <router-link 
          class="category-item" 
          v-for="category in filteredCategoryList" 
          :key="category" 
          :to="{ name: 'GamesByCategory', params: { category: encodeURIComponent(category) }}">
          {{ category }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      categories: [],
      categorySearchQuery: '',
    };
  },
  async created() {
    await this.fetchCategories();
  },
  computed: {
    filteredCategoryList() {
      if (!this.categorySearchQuery) {
        return this.categories;
      }
      return this.categories.filter(category =>
        category.toLowerCase().includes(this.categorySearchQuery.toLowerCase())
      );
    }
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
.categories-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0px;
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
  width: 190px;
  overflow: hidden; 
  font-size:18px;
}

.category-item:hover {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

.search-categories-container {
  width: 35% !important;
}
</style>
