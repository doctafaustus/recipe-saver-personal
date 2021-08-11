<template>
  <div id="detail-panel" class="panel" :class="{ 'edit-mode' : editMode === true, 'saving': savingOverlayActive === true }">

    <div class="detail-panel-innner">
      <ul id="utility-bar">
        <li v-show="!recipe.newEntry" id="more-actions-container">
          <div class="utility-btn" @click="actionsVisible = !actionsVisible">
            <icon name="dots"/>
          </div>
          <div class="utility-tooltip" v-show="!actionsVisible">
            <div class="utility-tooltip-text">Actions</div>
          </div>
          <ul v-show="actionsVisible" id="more-actions-menu" class="box">
            <li v-show="!editMode" @click="editRecipe()" class="action-edit">Edit Recipe</li>
            <li v-show="editMode" @click="cancel()" class="action-cancel">Cancel</li>
            <li @click="toggleScreen()" class="action-toggle-screen">{{ screenModeText }}</li>
            <li v-show="!editMode" @click="shareRecipe()" class="action-share"><span>Share Recipe</span>
              <span v-if="!isPaidPlan"><icon name="lock"/></span>
            </li>
            <li @click="print()" class="action-print">Print</li>
            <li v-if="!confirmActive" @click="confirmActive = true" class="action-delete">Delete Recipe</li>
            <li v-else @click="deleteRecipe()" class="confirm-delete">Confirm Delete</li>
          </ul>  
        </li>
        <li v-show="!recipe.newEntry" >
          <div class="utility-btn" @click="toggleFavorite()">
            <icon v-if="recipe.favorite" name="starFilled"/>
            <icon v-else name="star"/>
          </div>
          <div class="utility-tooltip">
            <div class="utility-tooltip-text">{{ favoriteToggleText }}</div>
          </div>
        </li>
        <li @click="closeDetails()">
          <div class="utility-btn">
            <icon name="close"/>
          </div>
          <div class="utility-tooltip">
            <div class="utility-tooltip-text">Close</div>
          </div>
        </li>
      </ul>

      <div v-if="!editMode" id="title-read-only">{{ recipe.title }}</div>
      <div v-else id="title-edit">
        <label>Title</label>
        <input v-model="recipe.title" id="title-input" type="text" autocomplete="off">
      </div>

      <div v-if="recipe.url && !editMode" id="url-read-only">
        <a :href="recipe.url" target="_blank">{{ recipe.url }}</a>
      </div>
      <div v-else-if="recipe.url === '' && !editMode" style="display: none;"></div>
      <div v-else id="url-edit">
        <label>URL</label>
        <input v-model="recipe.url" id="url-input" type="text" autocomplete="off">
      </div>

      <label v-show="editMode">Ingredients / Description</label>
      <div v-show="recipe.description || editMode" id="description">
        <editor-menu-bar :editor="editor" v-show="editMode === true">
          <div slot-scope="{ commands, isActive }" class="menubar">

            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.bold() }" @click="commands.bold">
              <icon name="bold"/>
            </button>
            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.italic() }" @click="commands.italic">
              <icon name="italic"/>
            </button>
            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.strike() }" @click="commands.strike">
              <icon name="strike"/>
            </button>
            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.underline() }" @click="commands.underline">
              <icon name="underline"/>
            </button>
            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.bullet_list() }" @click="commands.bullet_list">
              <icon name="ul"/>
            </button>
            <button class="menubar__button" tabindex="-1" :class="{ 'is-active': isActive.ordered_list() }" @click="commands.ordered_list">
              <icon name="ol"/>
            </button>
            <button class="menubar__button" tabindex="-1" @click="commands.horizontal_rule">
              <icon name="hr"/>
            </button>
            <button class="menubar__button" tabindex="-1" @click="commands.undo">
              <icon name="undo"/>
            </button>
            <button class="menubar__button" tabindex="-1" @click="commands.redo">
              <icon name="redo"/>
            </button>

          </div>
        </editor-menu-bar>
        <editor-content :editor="editor" id="editor" v-model="recipe.description"></editor-content>
      </div>

      <ul id="tags">
        <!-- Autocomplete List -->
        <li v-if="editMode" class="tags-icon"><icon name="tags"/></li>
        <li v-if="editMode" id="new-tag">
          <form id="new-tag-form" @submit.prevent="addNewTag()">
            <input type="text" id="new-tag-input" v-model="tagQuery" @keyup="debounceInput($event)" autocomplete="off">
          </form>
          <ul v-if="showAutocompleteList" id="tag-autocomplete-list">
            <li class="add-tag-row" @click="addNewTag()">
              <span>Add Tag: </span><b>{{ tagQuery }}</b>
            </li>
            <li v-if="autocompleteTags.length" id="tag-suggestions">
              <ul>
                <li v-for="tag in autocompleteTags" :key="tag.name" class="tag">
                  <div class="tag-suggestion" :style="dynamicBackgroundColor(tag)" @click="selectAutocompleteTag(tag.name)">
                    <span class="tag-name">{{ tag.name }}</span>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </li>

        <!-- Normal Tag List -->
        <li class="tag" v-for="tag in recipe.tags" :key="tag.name" @click="selectTag(tag)">
          <router-link v-if="!editMode" :style="dynamicBackgroundColor(tag)" :to="{path: `/recipes/tag/${tag.name}`}">
            <span class="tag-name">{{ tag.name }}</span>
          </router-link>
          <div v-else-if="tag.status !== 'toDelete'" class="tag-editable" :style="dynamicBackgroundColor(tag)">
            <span class="tag-name">{{ tag.name }}</span>
            <span @click="deleteTag($event, tag.name)" class="tag-delete"><icon name="close"/></span>
          </div>
        </li>
      </ul>

      <div v-show="recipe.image || editMode" class="recipe-image-container">
        <img v-if="!editMode" class="recipe-image" :src="recipeImage()">
        <img v-else class="recipe-image recipe-image-preview" :src="imagePreview || recipeImage() || blankImage">
        <div class="recipe-image-overlay" v-show="editMode">
          <form id="image-form" onsubmit="event.preventDefault();">
            <div class="recipe-image-overlay-text">
              <span class="recipe-image-overlay-text-drag">Drag Photo Here</span>
              <span class="recipe-image-overlay-text-prefer">Or, if you prefer...</span>
              <span v-if="((recipe.image === '' || recipe.image === undefined) && !imagePreview) || imagePreview === blankImage"></span>
              <div v-else @click="removeImage()" id="remove-image">Remove Image</div>
            </div>
            <button @click="triggerUpload()" id="image-input-btn">Choose File</button>
            <input type="file" id="image-input" accept="image/*" ref="imageInput">
          </form>
        </div>
      </div>

      <div v-show="editMode" class="save-cancel">
        <div @click="cancel()" class="cancel">Cancel</div>
        <div @click="saveRecipe()" class="save-recipe btn">Save</div>
      </div>
    </div>

    <div id="saving-overlay">
      <p>Saving recipe</p>
      <img src="../assets/spinner.gif">
    </div>

  </div>
</template>

<script>
import Vue from 'vue';
import EventBus from '@/EventBus';
import utils from '@/mixins/utils';
import RecipeService from '@/services/RecipeService';
import Icon from '@/components/Icons';
import debounce from 'debounce';
import { Editor, EditorContent, EditorMenuBar } from 'tiptap';
import {
  HardBreak,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  Bold,
  Italic,
  Strike,
  Underline,
  History,
} from 'tiptap-extensions';


export default {
  components: {
    EditorMenuBar,
    EditorContent,
    Icon
  },
  props: ['screenModeText', 'isPaidPlan'],
  data() {
    return {
      recipe: {},
      editor: null,
      actionsVisible: false,
      editMode: true,
      confirmActive: false,
      imagePreview: '',
      blankImage: 'https://res.cloudinary.com/dzynqn10l/image/upload/v1628695697/recipe-saver-personal/default-profile_1_jithvf.jpg',
      imageAsset: null,
      savingOverlayActive: false,
      tagQuery: '',
      autocompleteTags: [],
      showAutocompleteList: false,
    };
  },
  mixins: [utils],
  beforeUpdate() {
    if (!this.recipe._id && !this.recipe.newEntry) this.closeDetails();
  },
  methods: {
    selectTag(tag) {
      if (this.editMode) return;
      EventBus.$emit('TAG_SELECTED', tag);
    },
    deleteTag(e, tagName) {
      const tagToDelete = this.recipe.tags.find(tag => tag.name === tagName);
      if (!tagToDelete.status) {
        Vue.set(tagToDelete, 'original', true);
      }
      Vue.set(tagToDelete, 'status', 'toDelete');
    },
    removeEditMode() {
      this.editMode = false;
      if (this.editor) {
        this.editor.setOptions({editable: false});
      }
      this.imagePreview = '';
      this.imageAsset = false;
      this.tagQuery = '';
      this.resetTags();
    },
    async retrieveRecipe() {
      const recipeID = this.$route.query.id;
      if (!recipeID || recipeID === 'new') return;
      const response = await RecipeService.getRecipe(recipeID);
      this.recipe = response.data;
      this.editor.setContent(this.recipe.description);
      EventBus.$emit('RECIPE_SELECTED');
    },
    toggleFavorite() {
      this.recipe.favorite = !this.recipe.favorite;
      const message = this.recipe.favorite ? 'favorited' : 'unfavorited';
      this.saveRecipe(message);
    },
    closeDetails() {
      this.removeEditMode();
      EventBus.$emit('CLOSE_DETAILS');
    },
    editRecipe() {
      this.actionsVisible = false;
      this.editMode = true;
      this.editor.setOptions({editable: true});
    },
    async shareRecipe() {
      if (!this.isPaidPlan) {
        return EventBus.$emit('MESSAGE', {
          title: 'Paid Feature',
          message: 'To share recipes you\'ll need to upgrade your account on your Account page.',
          isError: true,
          timeout: 40000
        });
      }

      const response = await RecipeService.shareRecipe(this.recipe._id);
      const origin = window.location.origin;
      const shareLink = `${origin}/share/${encodeURIComponent(response.data.result)}`;
      EventBus.$emit('MESSAGE', {
        title: 'Share Link:',
        message: shareLink,
        isShareLink: true,
        timeout: 40000
      });
    },
    print() {
      this.actionsVisible = false;
      this.removeEditMode();
      setTimeout(window.print, 100);
    },
    confirmDelete() {
      this.actionsVisible = false;
      this.removeEditMode();
    },
    async deleteRecipe() {
      this.confirmActive = false;
      const recipeTitle = this.recipe.title;
      const response = await RecipeService.deleteRecipe(this.recipe._id);
      if (response.status !== 200) return;

      this.closeDetails();
      EventBus.$emit('MESSAGE', {
        title: recipeTitle,
        message: 'deleted'
      });
      EventBus.$emit('RECALUCATE_TAGS');

      const query = Object.assign({}, this.$route.query);
      delete query.id;
      this.$router.replace({ query });
    },
    toggleScreen() {
      this.actionsVisible = false;
      EventBus.$emit('TOGGLE_SCREEN');
    },
    saveDescription() {
      // Since tiptap does not use v-model we need to save the description manually
      const editorHTML = this.editor.getHTML();
      if (editorHTML === '<p></p>') {
        this.recipe.description = '';
      } else {
        this.recipe.description = this.editor.getHTML();
      }
    },
    cancel() {
      this.actionsVisible = false;
      this.removeEditMode();
      this.retrieveRecipe();
      if (this.recipe.newEntry) {
        this.closeDetails();
      }
    },
    async saveRecipe(message = 'was saved!') {
      this.savingOverlayActive = true;

      let updateImage = false;
      if (this.imageAsset !== false && this.imageAsset !== 'remove') {
        updateImage = true;
      }

      this.recipe.image = this.imageAsset || this.recipe.image;

      if (this.recipe.title.trim() === '') {
        this.savingOverlayActive = false;
        return EventBus.$emit('MESSAGE', {
          title: this.recipe.title,
          message: 'Recipe must have a title',
          isError: true,
          timeout: 6000
        });
      }

      if (this.imageAsset && this.imageAsset.size > 3000000) {
        this.savingOverlayActive = false;
        return EventBus.$emit('MESSAGE', {
          title: this.recipe.title,
          message: 'Cannot save - Image must be 3MB or less',
          isError: true,
          timeout: 6000
        });
      }

      // Add "http://" to URLs without protocol
      const initialUrl = this.recipe.url.trim();
      const protocolRegExp = new RegExp(/^https?:\/\//i);
      const protocol = (initialUrl.match(protocolRegExp) || [])[0];
      let formattedUrl = `${!protocol ? 'http://' : ''}${initialUrl}`;
      if (initialUrl === '') formattedUrl = '';
      this.recipe.url = formattedUrl;

      this.saveDescription();
      this.recipe.tags = this.recipe.tags.filter(tag => {
        return tag.status !== 'toDelete';
      });
      this.removeTagStatus();
      delete this.recipe.newEntry;
      const response = await RecipeService.updateRecipe(this.recipe._id, this.recipe, updateImage, this.imageAsset === 'remove');

      this.recipe.image = response.data.image;
      this.removeEditMode();
      this.savingOverlayActive = false;

      if (response.data.message && response.data.message === 'Limit reached') {
        return EventBus.$emit('MESSAGE', {
          title: 'Paid Feature',
          message: 'To save more than 5 recipes you\'ll need to upgrade your account on your Account page.',
          isError: true,
          timeout: 40000
        });
      }

      EventBus.$emit('RECIPE_SAVED');
      EventBus.$emit('RECALUCATE_TAGS');
      EventBus.$emit('MESSAGE', {
        title: this.recipe.title,
        message: message,
      });

    },
    debounceInput: debounce(function(e) {
      this.fetchTags(e);
    }, 300),
    async fetchTags(e) {
      this.showAutocompleteList = false;
      const query = e.target.value.toLowerCase().trim();
      if (!query) return;
      const response = await RecipeService.getTags(query);

      let exstingTags = this.recipe.tags.filter(tag => {
        return !tag.status || tag.status === 'toDelete';
      });
      exstingTags = this.recipe.tags.map(tag => tag.name);
      this.autocompleteTags = response.data.filter(tag => {
        return exstingTags.indexOf(tag.name) === -1;
      });
      this.showAutocompleteList = true;
    },
    selectAutocompleteTag(tagName) {
      const selectedTag = this.autocompleteTags.find(tag => tag.name === tagName);
      Vue.set(selectedTag, 'status', 'toAdd');
      this.recipe.tags.push(selectedTag);
      this.clearTagQueryAndRefocus();
    },
    addNewTag() {
      const newTag = {
        color: '#808080',
        name: this.tagQuery.trim(),
      };
      const existingTag = this.recipe.tags.find(tag => {
        return tag.name === this.tagQuery.trim();
      });

      if (existingTag) {
        if (existingTag.status === 'toDelete') {
          existingTag.status = 'toAdd';
          newTag.color = existingTag.color;
        }
      } else {
        if (window.tagColorMap[newTag.name]) {
          newTag.color = window.tagColorMap[newTag.name];
        }
        Vue.set(newTag, 'status', 'toAdd');
        this.recipe.tags.push(newTag);
      }

      this.clearTagQueryAndRefocus();
    },
    clearTagQueryAndRefocus() {
      this.showAutocompleteList = false;
      this.tagQuery = '';
      document.querySelector('#new-tag-input').focus();
    },
    removeTagStatus() {
      this.recipe.tags.forEach(tag => {
        delete tag.status;
        delete tag.original;
      });
    },
    resetTags() {
      if (!this.recipe.tags) return;
      this.recipe.tags = this.recipe.tags.filter(tag => {
        const tagToReturn = tag.original || !tag.status;
        return tag.original || !tag.status;
      });
      this.removeTagStatus();
    },
    triggerUpload() {
      this.$refs.imageInput.click();
    },
    removeImage() {
      this.imagePreview = this.blankImage;
      this.imageAsset = 'remove';
    },
    handleImage(e, imageObj) {
      // imageObj is the result of a drag and drop
      if (imageObj) {
        if (imageObj.url) {
          this.imagePreview = imageObj.url;
          this.imageAsset = imageObj.url;
          return;
        } else {
          this.imageAsset = imageObj.image;
        }
      } else {
        this.imageAsset = e.target.files[0];
      }

      const reader = new FileReader();
      reader.readAsDataURL(this.imageAsset);
      reader.addEventListener('load', e => {
        this.imagePreview = e.target.result;
      });

    },
    recipeImage() {
      return this.recipe.image || this.blankImage;
    }
  },
  computed: {
    favoriteToggleText() {
      return this.recipe.favorite ? 'Unfavorite' : 'Favorite';
    },
  },
  mounted() {
    this.editor = new Editor({
      extensions: [
        new HardBreak(),
        new BulletList(),
        new HorizontalRule(),
        new OrderedList(),
        new ListItem(),
        new Bold(),
        new Italic(),
        new Strike(),
        new Underline(),
        new History(),
      ],
    });
    // The editor must be set to false first or editor buttons won't work
    this.editor.setOptions({editable: false});

    EventBus.$on('NEW_RECIPE', () => {
      this.$router.push({ path: this.$route.path, query: { id: 'new' } });
      this.removeEditMode();
      this.recipe = {
        newEntry: true,
        description: '',
        favorite: false,
        image: '',
        tags: [],
        title: '',
        url: '',
      };
      this.editor.clearContent();
      this.editor.setOptions({editable: true});
      this.editMode = true;
    });

    // If a file was added then the value of the input will stay that way until it's changed again
    // This means we need to clear it out after a click to ensure the same file can be uploaded to trigger the change event
    document.querySelector('#image-input').addEventListener('click', e => {
      e.target.value = '';
    });
    document.querySelector('#image-input').addEventListener('change', this.handleImage);


    const dropArea = document.querySelector('.recipe-image-overlay');
    dropArea.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/html', null);
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('highlight');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('highlight');
      });
    });


    dropArea.addEventListener('drop', e => {
      const imageURL = e.dataTransfer.getData('Text');

      const draggedImage = {
        image: e.dataTransfer.files[0],
        url: imageURL ? imageURL : null,
      };

      this.handleImage(e, draggedImage);
    });

  },
  created() {
    document.addEventListener('click', e => {

      // More actions click off
      const isChildOfMoreActions = e.target.closest('#more-actions-container') || e.target.matches('#more-actions-container');
      if (!isChildOfMoreActions) {
        this.actionsVisible = false;
      }

      // Confirm delete click off
      const isMoreActions = e.target.matches('.confirm-delete');
      if (!isMoreActions) {
        this.confirmActive = false;
      }

      // Tag autocomplete click off
      const isAutocompleteItem = e.target.closest('#tag-autocomplete-list') || e.target.matches('#tag-autocomplete-list');
      if (!isAutocompleteItem) {
        this.showAutocompleteList = false;
      }
    });
  },
  beforeDestroy() {
    this.editor.destroy();
  },
  watch: {
    '$route.query': {
      handler() {
        if (this.$route.query.id === 'new') return;
        this.retrieveRecipe();
      },
      immediate: true,
    },
    '$route': {
      handler() {
        if (this.$route.query.id === 'new') return;
        this.removeEditMode();

        if (window.matchMedia('(max-width: 767px)').matches &&
            !this.$route.query.id
        ) {
          EventBus.$emit('CLOSE_DETAILS');
        }
      }
    }
  }
}
</script>

<style lang="scss">
  @import '@/styles/_detail-panel.scss';
  @import '@/styles/_detail-panel-mobile.scss';
</style>

