<!-- GameDetails.vue -->
<template>
  <div v-if="loading" class="column-background">
    Loading game details...
  </div>
  <div v-else-if="error" class="column-background">
    Error loading game details: {{ error }}
  </div>
  <div v-else class="col m11 column-background">
    <div class="section">
      <div class="game-details">
        <img :src="gameData.image" style="border-radius:4px;" alt="Game image" width="200" height="200" />
        <div class="game-info">
          <h2 style="color: white;">{{ gameData.name }} ({{ gameData.year}})</h2>
          <div style="display: flex; flex-direction: column;">
            <div style="display: flex; color: white;">
              <div style="padding-right: 10px;">Players: {{ gameData.min_players }} - {{ gameData.max_players }}</div>
              <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Playing time: {{ gameData.play_time }} minutes</div>
              <div style="border-left: 1px solid white; padding-left: 10px; padding-right: 10px;">Age: {{ gameData.age }}</div>
              <div v-if="averageRating !== null" style="border-left: 1px solid white; padding-left: 10px;">Rating: {{ averageRating.toFixed(1) }}</div>
              <div class="rating-container">
                <span v-for="star in 10" :key="star" class="star" 
                      @click="setRating(star)" 
                      @mouseover="hoverRatingChange(star)" 
                      @mouseleave="hoverRatingChange(0)">
                  <img src="/star-filled.png" v-if="star <= hoverRating || (!hoverRating && star <= currentRating)" alt="Filled Star"/>
                  <img src="/star-empty.png" v-else alt="Empty Star"/>
                </span>
                <button v-if="currentRating > 0" @click="removeRating" class="btn-remove-rating">
                  <img src="/cancel.svg" alt="X"/>
                </button>           
              </div>
            </div>
            <div v-if="gameData.categories" class="game-categories">
              <div class="categories-title">
                <h5>Categories:</h5>
              </div>
              <ul>
                <li v-for="category in gameData.categories" :key="category">
                  <router-link :to="{ name: 'GamesByCategory', params: { category: category }}">
                    {{ category }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="button-container">
      <button @click="addToShelf" :class="['btn', isGameInShelf ? 'btn-remove' : 'btn-add']">
        {{ isGameInShelf ? 'Remove from Shelf' : 'Add to Shelf' }}
      </button>
    
      <button @click="addToWishlist" :class="['btn', isGameInWishlist ? 'btn-remove' : 'btn-add']">
        {{ isGameInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist' }}
      </button>
    
      <button @click="addToFavorites" :class="['btn', isGameInFavorites ? 'btn-remove' : 'btn-add']">
        {{ isGameInFavorites ? 'Remove from Favorites' : 'Add to Favorites' }}
      </button>
    </div>
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
      isGameInShelf: false,
      isGameInWishlist: false,
      isGameInFavorites: false,
      loading: false,
      error: null,
      averageRating: null,
      currentRating: 0,
      hoverRating: 0,
    };
  },
  async created() {
    this.fetchGameData();
    this.fetchUserRating();
  },
  methods: {
    async fetchGameData() {
      this.loading = true;
      try {
        const response = await axios.get(`http://localhost:3000/game/${this.gameId}`, { withCredentials: true });
        this.gameData = response.data;

        // Check if owned_games exists and includes the current game
        this.isGameInShelf = response.data.owned_games ? response.data.owned_games.includes(this.gameId) : false;
        this.isGameInWishlist = response.data.wishlist ? response.data.wishlist.includes(this.gameId) : false;
        this.isGameInFavorites = response.data.favorites ? response.data.favorites.includes(this.gameId) : false;

        this.calculateAverageRating();
        this.error = null;
      } catch (error) {
        console.error("Error fetching game data:", error);
        this.error = error.message || "An error occurred";
      } finally {
        this.loading = false;
      }
    },

    async fetchUserRating() {
      try {
        const response = await axios.get(`http://localhost:3000/user-rating/${this.gameId}`, { withCredentials: true });
        if (response.data.rating) {
          this.currentRating = response.data.rating;
        }
      } catch (error) {
        console.error("Error fetching user rating:", error);
      }
    },

    calculateAverageRating() {
      if (this.gameData.total_rating_score !== undefined && this.gameData.rating_count > 0) {
        this.averageRating = this.gameData.total_rating_score / this.gameData.rating_count;
      } else {
        this.averageRating = null;
      }
    },

    async addToShelf() {
      try {
        const response = await axios.get('http://localhost:3000/check-login-status', { withCredentials: true });
        if (response.data.isLoggedIn) {
          if (!this.isGameInShelf) {
            await this.addGameToShelf();
          } else {
            this.removeFromShelf();
          }
        } else {
          alert('You must be logged in to add games to your shelf');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        alert('Unable to check login status');
      }
    },

    async addGameToShelf() {
      try {
        await axios.post('http://localhost:3000/add-to-shelf', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInShelf = true;
        alert('Game added to your shelf!');
      } catch (error) {
        console.error('Error adding game to shelf:', error);
        alert('Failed to add game to shelf');
      }
    },

    async removeFromShelf() {
      try {
        await axios.post('http://localhost:3000/remove-from-shelf', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInShelf = false;
        alert('Game removed from your shelf!');
      } catch (error) {
        console.error('Error removing game from shelf:', error);
        alert('Failed to remove game from shelf');
      }
    },

    async addToWishlist() {
      try {
        const response = await axios.get('http://localhost:3000/check-login-status', { withCredentials: true });
        if (response.data.isLoggedIn) {
          if (!this.isGameInWishlist) {
            await this.addGameToWishlist();
          } else {
            this.removeFromWishlist();
          }
        } else {
          alert('You must be logged in to add games to your wishlist');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        alert('Unable to check login status');
      }
    },

    async addGameToWishlist() {
      try {
        await axios.post('http://localhost:3000/add-to-wishlist', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInWishlist = true;
        alert('Game added to wishlist!');
      } catch (error) {
        console.error('Error adding game to wishlist:', error);
        alert('Failed to add game to wishlist');
      }
    },

    async removeFromWishlist() {
      try {
        await axios.post('http://localhost:3000/remove-from-wishlist', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInWishlist = false;
        alert('Game removed from wishlist!');
      } catch (error) {
        console.error('Error removing game from wishlist:', error);
        alert('Failed to remove game from wishlist');
      }
    },

    async addToFavorites() {
      try {
        const response = await axios.get('http://localhost:3000/check-login-status', { withCredentials: true });
        if (response.data.isLoggedIn) {
          if (!this.isGameInFavorites) {
            await this.addGameToFavorites();
          } else {
            this.removeFromFavorites();
          }
        } else {
          alert('You must be logged in to add games to favorites');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        alert('Unable to check login status');
      }
    },

    async addGameToFavorites() {
      try {
        await axios.post('http://localhost:3000/add-to-favorites', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInFavorites = true;
        alert('Game added to favorites!');
      } catch (error) {
        console.error('Error adding game to favorites:', error);
        alert('Failed to add game to favorites');
      }
    },

    async removeFromFavorites() {
      try {
        await axios.post('http://localhost:3000/remove-from-favorites', { gameId: this.gameId }, { withCredentials: true });
        this.isGameInFavorites = false;
        alert('Game removed from favorites!');
      } catch (error) {
        console.error('Error removing game from favorites:', error);
        alert('Failed to remove game from favorites');
      }
    },

    setRating(rating) {
      this.currentRating = rating;
      this.submitRating(rating);
    },

    hoverRatingChange(rating) {
      this.hoverRating = rating;
    },

    async submitRating(rating) {
      try {
        await axios.post('http://localhost:3000/rate-game', 
        { 
          gameId: this.gameId, 
          rating: rating 
        }, 
        { withCredentials: true });

        alert('Rating submitted successfully');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alert('You must be logged in to rate games');
          this.currentRating = 0;
          this.hoverRating = 0;
        } else {
          console.error('Error submitting rating:', error);
          alert('Failed to submit rating');
        }
      }
    },

    async removeRating() {
      try {
        await axios.delete(`http://localhost:3000/remove-rating/${this.gameId}`, { withCredentials: true });
        this.currentRating = 0;
        alert('Rating removed successfully');
      } catch (error) {
        console.error('Error removing rating:', error);
        alert('Failed to remove rating');
      }
    },
  },
};
</script>

<style scoped>
.column-background.main-content {
    margin-left: 2.5rem;
    margin-top: 5rem;
    border-radius: 5px;
}

.button-container {
  display: flex;
  justify-content: start;
  margin-top: 20px;
}

.btn {
  margin-right: 10px;
  padding: 10px 15px;
  color: white;
  border: 2px solid #474747;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transition: all 0.3s ease-in-out;
  font-size: 16px;
  font-weight: bold;
}

.btn-add {
  background-color: #4caf50;
}
.btn-add:hover {
  background-color: #2c612f;
}

.btn-remove {
  background-color: #e53935;
}

.btn-remove:hover {
  background-color: #7a1f1c;
}

.btn:hover {
  color: #e2e2e2;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  transform: translateY(-2px);
}

.game-details {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

.game-info {
  display: flex;
  flex-direction: column;
  margin-left: 20px;
}

.game-categories {
  display: flex;
  align-items: center;
  color: white;
  margin-top:1rem;
}

.categories-title {
  margin-right: 10px;
}

.game-categories ul {
  display: flex;
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.game-categories li {
  margin-right: 10px;
}

.game-categories a {
  text-decoration: none;
  color: #FFF;
  padding: 4px 8px;
  border-radius: 5px;
  background-color: #474747;
  transition: background-color 0.3s ease;
}

.game-categories a:hover {
  background-color: #5c5c5c;
}

.game-categories h5 {
  font-size: 15px;
  margin: 0;
}

.rating-container {
  margin-left: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.star {
  cursor: pointer;
  position: relative;
  margin: 0 2px;
  transition: all 0.3s ease-in-out;
}

.star img {
  height: 20px;
  width: 20px;
  transition: transform 0.3s ease;
}

.star::before,
.star::after {
  content: '';
  position: absolute;
  left: -5px;
  right: -5px;
}

.star:hover img {
  transform: scale(1.1);
}

.btn-remove-rating {
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
  padding: 0;
  margin-left: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.btn-remove-rating img {
  height: 20px;
  width: 20px;
}

.btn-remove-rating:hover img {
  transform: scale(1.1);
}

</style>
