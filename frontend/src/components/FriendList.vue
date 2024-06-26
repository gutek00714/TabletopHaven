<template>
  <div class="col m11 column-background">
    <div v-if="isAuthenticated">
      <div class="row section">
        <h4>Search Users</h4>
        <div class="col m7">
          <form @submit.prevent="searchBoardGames(searchQuery)">
            <div class="input-field center-align search-bar-container" ref="searchContainer">
                <i class="material-icons" style="margin-left: 10px;">search</i>
                <input v-model="searchQuery" class="input-search" id="search" type="search" @input="debouncedOnChange" required>
                <i class="material-icons" @click="clearSearch" style="margin-right: 10px;">close</i>
                <div v-if="searchResults.length" class="search-results-dropdown">
                  <ul>
                    <li v-for="user in searchResults" :key="user.id">
                      <router-link :to="`/user/${user.id}`" @click="clearSearch">
                        <img :src="user.profile_image_url" class="dropdown-user-image" alt="User Image">
                        {{ user.username }}
                      </router-link>
                    </li>
                  </ul>
                </div>
            </div>
          </form>
        </div>
      </div>
      <div class="row section">
        <h4>Friends</h4>
        <!-- Always show the search input -->
        <div class="row section"> 
          <input v-model="friendSearchQuery" type="text" placeholder="Search friends" class="search-friends-container white-text"> 
        </div>
        <div v-if="loading" class="loading">Loading friends list...</div>
        <div v-else-if="error" class="error-message">{{ error }}</div>
        <!-- Only display the friends list if there are friends to show -->
        <ul class="friends-list" v-if="hasFriends">
          <li v-for="friend in filteredFriendsList" :key="friend.id">
            <router-link :to="`/user/${friend.id}`" class="friend-item">
              <img :src="friend.profile_image_url" class="friend-image" alt="Friend Image">
              <span class="friend-name">{{ friend.username }}</span>
            </router-link>
          </li>
        </ul>
        <!-- Optionally, display a message if no friends match the search -->
        <div v-if="!hasFriends && friendSearchQuery" class="no-friends-message">
          No friends match your search.
        </div>
      </div>      
    </div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import _debounce from 'lodash.debounce';

export default {
  name: 'FriendList',
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },

  data() {
    return {
      friendsList: [],
      isAuthenticated: false,
      loading: false,
      error: null,
      searchQuery: '',
      searchResults: [],
      friendSearchQuery: '',
    };
  },
  async created() {
    await this.fetchFriends();
  },

  computed: {
    hasFriends() {
      return this.filteredFriendsList.length > 0;
    },
    
    debouncedOnChange () {
      return _debounce(this.searchUsers, 700);
    },

    filteredFriendsList() {
      if (!this.friendSearchQuery) {
        return this.friendsList;
      }
      return this.friendsList.filter(friend =>
        friend.username.toLowerCase().includes(this.friendSearchQuery.toLowerCase())
      );
    }
  },

  methods: {
    async fetchFriends() {
      this.loading = true;
      try {
        const response = await fetch('http://localhost:3000/user-friends', {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const friends = await response.json();
          if (friends.length === 0) {
            this.error = "You have no friends.";
            this.isAuthenticated = true;
            this.friendsList = [];
          } else {
            this.friendsList = friends;
            this.isAuthenticated = true;
          }
        } else {
          if (response.status === 401 || response.status === 403) {
            this.error = "You need to log in to see your friends.";
            this.isAuthenticated = false;
          } else {
            this.error = 'Failed to fetch friends';
          }
        }
      } catch (error) {
        if (!this.error) {
          this.error = 'An error occurred while fetching your friends.';
        }
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
      }
    },

    searchUsers() {
      if (!this.searchQuery) {
        this.searchResults = [];
        return;
      }
      fetch(`http://localhost:3000/search-users?q=${encodeURIComponent(this.searchQuery)}`)
        .then(response => response.json())
        .then(users => {
          this.searchResults = users;
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
}
</script>

<style scoped>
.row {
  margin-left: 0 !important;
}

.column-background.main-content {
  margin-left: 2.5rem;
  border-radius: 5px;
}

.friends-list-view {
  padding: 20px;
}

.friends-list {
  margin-top: 3rem;
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.friend-item {
  margin: 0.5rem;
  padding: 1.5rem;
  border-radius: 10px;
  background-color: #272538;
  transition: all 0.3s ease;
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  color: #FFF;
  display: inline-flex;
  align-items: center;
  text-align: left;
  min-height: 100px;
  width: auto;
  max-width: fit-content;
  overflow: hidden; 
  font-size:18px;
}

.friend-item:hover {
  background-color: #322f46;
  box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.8);
  transform: translateY(-2px);
}

.friend-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 15px;
}

.friend-name {
  font-size: 1.2em;
}

.user-search-container .input-field {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}


/* Adjustments for smaller screens */
@media (max-width: 600px) {
  .friend-item {
    flex-direction: column;
  }

  .friend-name {
    margin-top: 10px;
  }
}

.input-field {
  display: flex;
  align-items: center;
  background-color: #343246;
  border-radius: 4px;
  height: 64px;
  transition: background-color 0.3s ease;
}

.input-field i.material-icons {
  color: #e2e2e2;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.input-field input.input-search[type="search"] {
  flex-grow: 1;
  background-color: transparent;
  border: none;
  color: #e2e2e2;
  padding-left: 16px;
  height: 100%;
  margin: 0;
}

.search-bar-container {
  height: 64px;
  margin-left: 3rem;
  position: relative;
  width: 100%;
}
.input-field:focus-within {
  background-color: #36344d; /* Change the background color when input is focused */
}

.input-field input.input-search[type="search"]:focus {
  background-color: transparent;
  border-radius:4px;
  color: #e2e2e2;
}

.search-results-dropdown {
  position: absolute;
  background-color: #2e2c45;
  color: #e2e2e2;
  border: 1px solid #444;
  border-radius: 4px;
  z-index: 100;
  top: 100%;
  width: calc(100% - 20px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  max-height: 300px;
  overflow-y: auto;
}
.search-bar-container {
  position: relative;
}

.search-results-dropdown ul a, search-results-dropdown ul router-link {
  list-style: none;
  padding: 0;
  margin: 0;
  border-radius:4px;
  margin-left: 10px;
  margin-right: 10px;
}

.search-results-dropdown li a, .search-results-dropdown li router-link {
  display: flex;
  align-items: center;
  padding: 10px;
  transition: background-color 0.3s;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
}

.dropdown-user-image {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.search-results-dropdown li a:last-child, .search-results-dropdown li router-link:last-child {
  border-bottom: none;
}

.search-results-dropdown li a:hover, .search-results-dropdown li router-link:hover {
  background-color: #38365a;
  display: flex;
  align-items: center;
  padding: 10px;
  transition: background-color 0.3s;
  border-radius: 6px;
}

.error-message {
  color: #9e9696;
  font-size: 1.2rem;
  margin-top: 1rem;
}

.error {
  font-size: 1.5rem;
  color: white;
  text-align: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  padding-right: 2rem;
}

.search-friends-container {
  width: 35% !important;
}

</style>