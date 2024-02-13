<!-- Navbar.vue -->
<template>
  <nav class="navbar" role="navigation">
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
                  <input v-model="searchQuery" class="input-search" id="search" type="search" @input="debouncedOnChange" required>
                    <label class="label-icon" for="search"><i class="material-icons" style="color:#e2e2e2">search</i></label>
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
          <button v-if="!isLoggedIn" @click="loginWithGoogle" class="auth-buttons btn-auth">LOGIN</button>
          <button v-else @click="logout" class="auth-buttons btn-auth">LOGOUT</button>
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
.brand-logo {
  color: #e2e2e2; /* Matching the navbar brand color */
}
.navbar {
  background-color: #2c2a3e;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.nav-wrapper {
  padding-left: 10px;
  padding-right: 10px;
}

.input-field {
  width: 100%;
  background-color: #343246;
  border: none;
  border-radius: 4px;
}

.nav-wrapper .input-field input.input-search[type="search"]:focus {
  color:#FFF;
  background-color: #36344d;
  border-radius:4px;
}

.search-bar-container {
  height: 64px;
  margin-left: 3rem;
  position: relative;
  width: 100%;
}

@import url('https://fonts.googleapis.com/icon?family=Material+Icons');
.label-icon {
  color: #e2e2e2;
}

.search-results-dropdown {
  position: absolute;
  background-color: #2c2a3e;
  color: #e2e2e2;
  border: 1px solid #444;
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
  border-radius:2px;
}

.search-results-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius:4px;
}

.search-results-dropdown li {
  display: flex;
  align-items: center;
  padding: 10px;
  transition: background-color 0.3s;
  border-radius: 6px;
}

.search-results-dropdown li:last-child {
  border-bottom: none;
}

.search-results-dropdown li router-link:hover {
  background-color: #38365a; /* Hover color */
}

.btn-auth {
  background-color: #4e4c67;
  color: #fff;
  border: 1px solid #6e6c81;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-auth:hover {
  background-color: #5e5c71;
  border-color: #7e7c91;
}
</style>
