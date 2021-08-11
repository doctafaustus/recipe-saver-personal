<template>
  <div id="list-panel" class="panel">
    <div id="heading-and-sort" :class="{ 'tag-view': getTaggedView() }">

      <div id="heading-and-sort-inner">
        <h1 id="list-panel-heading">{{ view }}</h1>

        <div id="layout-sort">
          <div id="sort" @click="sortVisible = !sortVisible">
            <span>Sort by: </span><span id="sort-selection">{{ sortBy }}</span>
            <img src="../assets/arrow-down-small.png">
          </div>

          <ul class="box" id="sort-options" v-show="sortVisible">
            <li class="sort-option" @click="sortRecipes($event, 'title', '-1')">a - z</li>
            <li class="sort-option" @click="sortRecipes($event, 'title', '1')">z - a</li>
            <li class="sort-option" @click="sortRecipes($event, 'creationDate', '1')">newest</li>
            <li class="sort-option" @click="sortRecipes($event, 'creationDate', '-1')">oldest</li>
          </ul>

          <div id="layout-toggle">
            <img v-show="imageLayout" class="layout-icon list-icon" src="../assets/layout-list-icon.svg" @click="toggleImageLayout()">
            <div class="utility-tooltip">
              <div class="utility-tooltip-text">List Layout</div>
            </div>
            <img v-show="!imageLayout" class="layout-icon image-icon" src="../assets/layout-image-icon.svg" @click="toggleImageLayout()">
            <div class="utility-tooltip">
              <div class="utility-tooltip-text">Image Layout</div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="getTaggedView()" class="selected-tag" :style="dynamicBackgroundColor(selectedTag)">
        <span class="tag-name">{{ selectedTag.name }}</span>
        <span class="tag-gear" @click="tagColorMenuVisible = !tagColorMenuVisible"></span>
      </div>
		</div>

    <ul v-show="tagColorMenuVisible" id="tag-color-menu" class="box">
      <li v-for="tagColor in tagColors" :key="tagColor.name" class="tag">
        <div class="tag-color-selection" @click="selectTagColor(tagColor.color)" :style="backgroundColor(tagColor.color)">{{ tagColor.name }}</div>
      </li>
    </ul>

    <ul id="recipe-list" class="list-panel-body" :class="{ 'image-layout' : imageLayout === true, 'tagged-view': getTaggedView() }">
      <li class="recipe-entry" v-for="recipe in recipes" :key="recipe.id" @click="selectRecipe(recipe._id)">
        <router-link :to="{ query: { id: recipe._id }}">
          <img class="recipe-image" :src="recipe.image || 'https://res.cloudinary.com/dzynqn10l/image/upload/v1628695697/recipe-saver-personal/default-profile_1_jithvf.jpg'">
          <span class="recipe-entry-left">{{ recipe.title }}</span>
          <span class="recipe-entry-right">{{ formatDate(recipe.creationDate) }}</span>
        </router-link>
      </li>
    </ul>

    <div v-show="showWelcome" id="welcome-overlay">
      <div class="welcome-overlay-body">To start adding recipes to your collection, click "New Recipe"</div>
      <div class="welcome-overlay-footer">
        Don't forget, you can also use the <a href="https://chrome.google.com/webstore/detail/recipe-saver/opemcijjekbnjccecheklfbflnkoacai" target="_blank">Chrome Extension</a> to automatically save recipes directly to this page.
      </div>
    </div>
  </div>
</template>

<script>
import EventBus from '@/EventBus';
import RecipeService from '@/services/RecipeService';
import utils from '@/mixins/utils';


export default {
  data() {
    return {
      sortBy: localStorage.sortBy ? localStorage.sortBy : null,
      sortVisible: false,
      imageLayout: (localStorage.imageLayout === 'true') ? true : false,
      recipes: [],
      selectedTag: {},
      tagColorMenuVisible: false,
      showWelcome: false,
      tagColors: [
        {
          color: '#ff0000',
          name: 'red'
        },
        {
          color: '#9e5f01',
          name: 'brown'
        },
        {
          color: '#ffa500',
          name: 'orange'
        },
        {
          color: '#dec688',
          name: 'gold'
        },
        {
          color: '#22da00',
          name: 'green'
        },
        {
          color: '#079212',
          name: 'forest'
        },
        {
          color: '#6d0873',
          name: 'eggplant'
        },
        {
          color: '#9522ff',
          name: 'purple'
        },
        {
          color: '#ff05d6',
          name: 'pink'
        },
        {
          color: '#00c5ff',
          name: 'ocean'
        },
        {
          color: '#2c77ff',
          name: 'blue'
        },
        {
          color: '#000000',
          name: 'black'
        },
      ]
    };
  },
  mixins: [utils],
  computed: {
    view() {
      let view = this.getViewName();
      view = (view === 'all') ? 'all recipes': view; 
      return view;
    }
  },
  methods: {
    getViewName() {
      return this.$route.path.replace('/recipes/', '');
    },
    scrollToImage(id) {
      if (!document.querySelector('#list-panel').classList.contains('full-width') ||
        !document.querySelector('#recipe-list').classList.contains('image-layout')) { 
        return;
      }
      setTimeout(() => {
        const clickedRecipe = document.querySelector(`.recipe-entry a[href*="${id}"]`);
        const recipePos = clickedRecipe.offsetTop;
        document.querySelector('#recipe-list').scrollTop = recipePos - 75;
      }, 50);
    },
    toggleImageLayout() {
      localStorage.imageLayout = !this.imageLayout;
      this.imageLayout = !this.imageLayout;
    },
    selectRecipe(id) {
      this.scrollToImage(id);
      EventBus.$emit('RECIPE_SELECTED', id);
    },
    getTaggedView() {
      return (this.$route.path.match(/\/recipes\/tag\/(.+)/) || [])[1];
    },
    sortRecipes(e, critea, order) {
      this.sortBy = e.target.innerText.toLowerCase();
      localStorage.sortBy = this.sortBy;
      this.sortVisible = false;
      this.retrieveRecipes(this.sortBy);
    },
    async selectTagColor(tagColor) {
      this.tagColorMenuVisible = false;
      const data = {
        tagToUpdate: this.selectedTag.name,
        newColor: tagColor
      };  

      window.tagColorMap[this.selectedTag.name] = tagColor;
      const response = await RecipeService.updateTagColor(data);
      const tagEls = document.querySelectorAll('.selected-tag, #tag-list .tag a, #tags .tag a, #tags .tag .tag-editable');
      [...tagEls].forEach(tag => {
        if (tag.querySelector('.tag-name').textContent.trim() === this.selectedTag.name) {
          tag.setAttribute('style', `background-color: ${tagColor};`);
        }
      });
    },
    async retrieveRecipes() {
      const response = await RecipeService.getRecipes(this.sortBy);
      this.recipes = response.data;
      if (!this.recipes.length && this.$route.path === '/recipes/all') this.showWelcome = true;
      else this.showWelcome = false;
    }
  },
  mounted() {
    EventBus.$on('RECIPE_SAVED', this.retrieveRecipes);
  },
  created() {
    document.addEventListener('click', e => {

      // Sort Options Menu
      const isChildOfSort = e.target.closest('#sort-options') || e.target.closest('#sort') || e.target.matches('#sort');
      if (!isChildOfSort) {
        this.sortVisible = false;
      }

      // Tag Colors Menu
      const isChildOfTagColorsMenu = e.target.closest('#tag-color-menu') || e.target.matches('#tag-color-menu') || e.target.matches('.tag-gear');
      if (!isChildOfTagColorsMenu) {
        this.tagColorMenuVisible = false;
      }
    });
  },
  watch: {
    '$route.params': {
      handler() {
        this.retrieveRecipes();

        if (this.$route.name === 'Tag') {
          this.selectedTag = {
            name: this.$route.params.tagName,
            color: '#808080'
          };

          // We need to close full screen details here if a user clicked a tag in the search results so the list panel will show
          if (this.$route.query && this.$route.query.id !== 'new' && !window.matchMedia('(max-width: 767px)').matches) {
            EventBus.$emit('TOGGLE_SCREEN', true);
          }

        }

      },
      immediate: true,
    }
  }
}
</script>

<style lang="scss">
#list-panel {
  padding: 0;
  width: 40%;
  max-width: 400px;
  min-width: 220px;
  margin-left: auto;
  margin-right: 20px;
  user-select: none;
  display: none;

  &.list-open {
    display: block;
  }

  &.full-width {
    max-width: 100%;
    width: 1000px;
    margin: 0 auto;

    .list-panel-body.image-layout {
      grid-template-columns: 1fr 1fr 1fr 1fr;
      grid-gap: 20px;
    }
  }

  #heading-and-sort {
    overflow: visible;
    height: 55px;
    width: 100%;
    position: relative;
    z-index: 10;
    background-color: #fff;
    box-sizing: border-box;
    padding: 10px 20px 0 20px;
    box-shadow: 0 0 2px rgba(0,0,0,0.10), 0 2px 2px rgba(0,0,0,.10);

    #heading-and-sort-inner {
      display: flex;
      justify-content: space-between;
      overflow: hidden;
      white-space: nowrap;
      padding-bottom: 2px;
    }

    &.tag-view {
      height: 88px;
    }

    #list-panel-heading {
      margin: 0 10px 0 0;
      font-size: 22px;
      position: relative;
      top: 6px;
      text-transform: capitalize;
    }

    #layout-sort {
      #sort {
        display: inline-block;
        margin-top: 10px;
        background-image: linear-gradient(to right, black 33%, rgba(255,255,255,0) 0%);
        background-position: bottom;
        background-size: 3px 1px;
        background-repeat: repeat-x;
        cursor: pointer;
        padding-bottom: 2px;

        #sort-selection {
          color: #089de3;
          font-weight: bold;
          text-transform: capitalize;
        }
      }
    }

    #sort-options {
      z-index: 2;
      position: absolute;
      right: 49px;
      top: 44px;
      text-align: left;

      li {
        padding: 3px 15px;
        cursor: pointer;
        height: 20px;
        line-height: 20px;
        text-transform: capitalize;

        &:hover {
          background-color: #008dff;
          color: white;
        }
      }
    }

    #layout-toggle {
      display: inline-block;
      margin-left: 12px;

      .layout-icon {
        width: 20px;
        position: relative;
        top: 4px;
        cursor: pointer;
        opacity: 0.7;

        &:hover + .utility-tooltip {
          display: inline-block;
          top: 50px;
          right: 0;
        }

        &.image-icon + .utility-tooltip {
          background-position-x: 54px; 
        }

        &.list-icon + .utility-tooltip {
          background-position-x: 40px; 
        }
      }

    }
  }

  .selected-tag {
    border-radius: 15px;
    color: white;
    background-color: #fff;
    display: inline-block;
    padding: 8px;
    font-size: 12px;
    margin-top: 8px;
    clear: both;
    float: left;

    .tag-count {
      margin-left: 4px;
    }

    .tag-gear {
      cursor: pointer;
      width: 10px;
      height: 10px;
      display: inline-block;
      margin-left: 6px;
      background-size: 10px 10px;
      position: relative;
      top: 1px;
      background-image: url(../assets/color-picker.png);

      &:hover {
        filter: invert(100%);
      }
    }
  }

  #tag-color-menu {
    z-index: 15;
    position: absolute;
    background-color: #fff;
    width: 153px;
    top: 93px;
    left: 20px;
    padding: 40px 10px 10px 10px;
    columns: 2;

    &::after {
      font-weight: bold;
      content: 'Change Tag Color';
      position: absolute;
      top: 0;
      width: 100%;
      left: 0;
      text-align: center;
      padding-top: 10px;
    }

    li {
      display: block;
      padding: 3px 0;

      .tag-color-selection {
        cursor: pointer;
        margin-right: 0;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

  .list-panel-body {
    box-sizing: border-box;
    padding: 10px 20px 20px 20px;
    width: 100%;
    max-height: calc(100% - 64px);
    overflow-y: auto;
    -webkit-tap-highlight-color: transparent;

    &.tagged-view {
      max-height: calc(100% - 88px) !important;
    }

    &.image-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 16px;
      justify-items: center;
      width: 100%;
      padding-top: 20px;

      .recipe-entry {
        margin-bottom: 6px;

        a {
          height: auto;
          border: none;

          &.router-link-exact-active {

            .recipe-image {
              border: solid 1px #089de3
            }

            .recipe-entry-left,
            .recipe-entry-right {
              font-weight: 500;
            }
          }

          .recipe-image {
            display: inline-block;
            border: solid 1px #dadada;
            box-sizing: border-box;
            width: 100%;
          }

          .recipe-entry-left {
            line-height: 16px;
            font-size: 14px;
            max-height: 178px;
            position: relative;
            top: -2px;
            word-wrap: break-word;
            word-break: break-all;
          }

          .recipe-entry-right {
            background: rgba(0,164,228,.69);
            border-radius: 0 0 0 80px;
            padding-right: 3px;
            padding-top: 2px;
            color: white;
            padding-left: 14px;
            font-size: 12px;
            line-height: 20px;
            letter-spacing: 0.3px;
            right: 1px;
            top: 1px;
          }
        }
      }
    }

    .recipe-entry {
      &:first-child {
        a {
          border-top: none;
        }
      }

      a {
        color: #000;
        overflow: auto;
        display: block;
        clear: both;
        position: relative;
        overflow: auto;
        border-top: solid 1px #dadada;
        height: 30px;
        line-height: 30px;
        cursor: pointer;
        overflow-y: hidden;
        text-align: left;

        &.router-link-exact-active {
          color: #0093ff;
          font-weight: 600;
        }

        .recipe-image {
          display: none;
        }

        .recipe-entry-left {
          float: left;
        }

        .recipe-entry-right {
          float: right;
          position: absolute;
          right: 0;
          z-index: 1;
          padding-left: 3px;
          color: #898e95;
          font-size: 14px;
          line-height: 30px;
          background-color: white;
          padding-left: 46px;
          background: -webkit-linear-gradient(-90deg, rgb(255, 255, 255), rgb(255, 255, 255), rgb(255, 255, 255), rgba(255, 255, 255, 0.3));
          background: -o-linear-gradient(-90deg, rgb(255, 255, 255), rgb(255, 255, 255), rgb(255, 255, 255), rgba(255, 255, 255, 0.3));
          background: -moz-linear-gradient(-90deg, rgb(255, 255, 255), rgb(255, 255, 255), rgb(255, 255, 255), rgba(255, 255, 255, 0.3));
          background: linear-gradient(-90deg, rgb(255, 255, 255), rgb(255, 255, 255), rgb(255, 255, 255), rgba(255, 255, 255, 0.3));
        }
      }
    }
  }

  .list-panel-body:not(.image-layout) {
    .recipe-entry:hover {
      + .recipe-entry a {
        border-top: solid 1px #0093ff;
      }
    }
  }

  #welcome-overlay {
    color: white;
    background-color: #089de3;
    padding: 10px;
    line-height: 22px;

    a {
      color: #000;

      &:hover {
        text-decoration: none;
      }
    }
  }
}

@import '@/styles/_list-panel-mobile.scss';
</style>

