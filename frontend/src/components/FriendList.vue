<template>
  <div class="col m9 column-background main-content">
    <div class="section white-text">
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
          <li v-for="user in searchResults" :key="user.id">
            <router-link :to="`/user/${user.id}`" @click="clearSearch">
              <!-- Display user details -->
              {{ user.username }}
            </router-link>
          </li>                                      
        </ul>
      </div>
    </div>
    <div class="section white-text">
      <h4>Friends</h4>
      <div v-if="loading" class="loading">Loading friends list...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="isAuthenticated">
        <ul class="friends-list">
          <li v-for="friend in friendsList" :key="friend.id">
            <router-link :to="`/user/${friend.id}`" class="friend-item">
              <img :src="friend.profile_image_url" class="friend-image" alt="Friend Image">
              <span class="friend-name">{{ friend.username }}</span>
            </router-link>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Please log in to view your friends list.</p>
      </div>
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
    };
  },
  async created() {
    await this.fetchFriends();
  },

  computed: {
    debouncedOnChange () {
      return _debounce(this.searchUsers, 700);
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
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }
        const friends = await response.json();
        this.isAuthenticated = true;
        this.friendsList = friends;
      } catch (error) {
        this.error = error.message;
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
.column-background.main-content {
  margin-left: 2.5rem;
  margin-top: 3rem;
  border-radius: 5px;
}

.friends-list-view {
  padding: 20px;
}

.friends-list {
  margin-top: 3rem;
  list-style-type: none;
  padding: 0;
}

.friend-item {
  margin: 0.5rem;
  padding: 1rem;
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

</style>
