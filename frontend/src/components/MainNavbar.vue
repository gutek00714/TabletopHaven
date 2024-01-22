<!-- Navbar.vue -->
<template>
  <nav class="light-blue lighten-1" role="navigation">
    <div class="nav-wrapper">
      <div class="row">
                <!-- Logo on the left -->
                <div class="col m2">
                  <router-link to="/" class="brand-logo">TabletopHaven</router-link>
                </div>
                
                <!-- Search bar in the center -->
                <div class="col m7">
                    <form @submit.prevent="searchBoardGames(searchQuery)">
                        <div class="input-field center-align search-bar-container" ref="searchContainer">
                          <input v-model="searchQuery" id="search" type="search" @input="debouncedOnChange" required>
                            <label class="label-icon" for="search"><i class="material-icons">search</i></label>
                            <i class="material-icons" @click="clearSearch">close</i>
                        </div>
                    </form>
                </div>

                <div v-if="searchResults.length" class="search-results-dropdown">
                  <ul>
                    <li v-for="game in searchResults" :key="game.id">
                      <router-link :to="`/game/${game.id}`" @click="clearSearch">
                        <img :src="game.image" class="game-image" alt="Game Image"> <!-- Game Image -->
                        {{ game.name }}
                      </router-link>
                    </li>                                      
                  </ul>
                </div>                
                

                <!-- Login button on the right -->
                <div class="col m3 right-align">
                  <button v-if="!isLoggedIn" @click="loginWithGoogle" class="waves-effect waves-light btn">Register/Login</button>
                  <button v-else @click="logout" class="waves-effect waves-light btn">Logout</button>
                </div>
            </div>
    </div>
  </nav>
</template>

<script>
import _debounce from 'lodash.debounce';

export default {
  name: 'MainNavbar',
  
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  data() {
  return {
    searchQuery: '',
    isLoggedIn: false, // This will be updated based on the user's login status
    searchResults: [],
  };
},

  computed: {
    debouncedOnChange () {
      return _debounce(this.searchBoardGames, 700);
    }
  },


  methods: {
    loginWithGoogle() {
      window.location.href = 'http://localhost:3000/auth/google';
    },  

    logout() {
      fetch('http://localhost:3000/logout', { 
        method: 'GET',
        credentials: 'include' // VERY important for sending cookies
      })
        .then(() => {
          console.log('Logged out, updating state');
          this.isLoggedIn = false;
          window.location.reload(); // Force a page reload
        })
        .catch(error => {
          console.error('Logout failed:', error);
        });
    },

    searchBoardGames() {
      if (!this.searchQuery) {
        this.searchResults = [];
        return;
      }
      fetch(`http://localhost:3000/search-games?q=${encodeURIComponent(this.searchQuery)}`)
        .then(response => response.json())
        .then(games => {
          this.searchResults = games;
        })
        .catch(error => console.error('Error fetching search results:', error));
    },

    clearSearch() {
      this.searchResults = [];
      this.searchQuery = '';
    },

    handleClickOutside(event) {
      const searchContainer = this.$refs.searchContainer;
      if (searchContainer && !searchContainer.contains(event.target)) {
        this.searchResults = [];
      }
    },
  },

  created() {
    // Check login status when the component is created
    fetch('http://localhost:3000/check-login-status', {
      method: 'GET',
      credentials: 'include' // Important for sending cookies
    })
      .then(response => response.json())
      .then(data => {
        this.isLoggedIn = data.isLoggedIn;
      })
      .catch(error => {
        console.error('Failed to check login status:', error);
      });
  }
}
</script>

<style scoped>
.nav-wrapper {
  padding-left: 10px;
  padding-right: 10px;
}

.search-bar-container {
  height: 64px;
  margin-left: 3rem;
  position: relative;
  width: 100%;
}

@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

.search-results-dropdown {
  position: absolute;
  background-color: #333;
  color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 100;
  top: 100%;
  width: calc(100% - 20px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  max-height: 300px;
  overflow-y: auto;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
}

@media screen and (max-width: 1000) {
  .search-results-dropdown {
    width: 95%;
    left: 50%;
    transform: translateX(-50%);
  }
}

.game-image {
  width: 30px;
  height: 30px;
  object-fit: cover;
  margin-right: 10px;
  vertical-align: middle;
}

.search-results-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-results-dropdown li {
  display: flex;
  align-items: center;
  padding: 10px;
}

.search-results-dropdown li:last-child {
  border-bottom: none;
}

.search-results-dropdown li:hover {
  background-color: #444;
}

</style>
