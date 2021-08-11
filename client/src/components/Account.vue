<template>
  <div id="account">

    <SideNav></SideNav>
    <Header></Header>
    <div id="account-container">
      <div class="account-left">
        <div :class=" { 'saving': imageIsSaving, 'profile-image-container': true }">
          <img id="profile-image" :src="getUserImg()">
          <input type="file" id="profile-image-input" accept="image/*" hidden ref="profileImageInput">
          <div @click="triggerUpload" id="profile-image-overlay">
            <button class="new-profile-image-btn">Update Image</button>
          </div>
        </div>
      </div>
      <div class="account-right">
        <div class="account-name">{{ user.name }}</div>
        <ul class="account-info">
          <li>
            <label>Account Type</label>
            <div class="account-info-value">{{ user.subscription }}</div>
          </li>
          <li>
            <label>You Login Via</label>
            <div class="account-info-value">{{ loginMethod }}</div>
          </li>
          <li>
            <label>Member Since</label>
            <div class="account-info-value">{{ formatDate(user.creationDate) }}</div>
          </li>
        </ul>
      </div>

      <div class="upgrade-downgrade-account">
        <!-- Show the cancel option for Full yearly customers only -->
        <a href="#" v-if="user.subscription === 'Full (20/yearly)'" @click.prevent="cancelSubscription()">Cancel Subscription</a>
        <router-link href="#" v-if="/Basic/.test(user.subscription)" :to="{ path: '/plans' }">Upgrade To Full Plan</router-link>
      </div>
      <div class="delete-account">
        <a href="#" @click.prevent="confirmDeleteAccount()">Delete Account</a>
      </div>
    </div>


    <div v-show="showModal" class="account-modal">
      <div class="account-modal-inner" :class="{ 'error': error, 'processing': processing === true, 'account-modal-inner': true, 'confirm-delete': isConfirmDelete }">
        <div class="rs-logo">
          <img class="rs-logo-image" src="../assets/logo-255x255.svg">
        </div>
        <div class="account-processing">Processing...</div>
        <div class="account-modal-title">{{ title }}</div>
        <div class="account-message">{{ message }}</div>
        <div v-show="!processing" class="account-modal-ctas">
          <div class="account-delete-confirm-btn account-modal-cta" v-show="isConfirmDelete" @click="deleteAccountFinal()">Delete Account</div>
          <div class="account-modal-cta account-modal-close" @click="showModal = false">Close</div>
        </div>
      </div>

      <div class="account-overlay"></div>
    </div>

  </div>
</template>

<script>
import Header from '@/components/Header.vue';
import EventBus from '@/EventBus';
import AuthService from '@/services/AuthService';
import MiscService from '@/services/MiscService';
import StripeService from '@/services/StripeService';
import Icon from '@/components/Icons';
import utils from '@/mixins/utils';
import SideNav from '@/components/SideNav.vue';

export default {
  components: {
    Header,
    Icon,
    SideNav
  },
  mixins: [utils],
  data() {
    return {
      user: {},
      imageIsSaving: false,
      showModal: false,
      processing: false,
      isConfirmDelete: false,
      error: false,
      title: '',
      message: '',
    };
  },
  computed: {
    loginMethod() {
      let method;
      if (Object.entries(this.user).length === 0 ) return '';
      if (this.user.googleId) method = 'Google';
      else if (this.user.facebookId) method = 'Facebook';
      else method = 'Email';

      const emailStr = ` (${this.user.email})`;
      return `${method}${method === 'Email' ? emailStr : '' }`;
    }
  },
  methods: {
    triggerUpload() {
      this.$refs.profileImageInput.click();
    },
    getUserImg() {
      return this.user.profileImage || 'https://res.cloudinary.com/dormh2fvt/image/upload/v1559367596/logo-255x255_r72o7i.png';
    },
    async getAccountData() {
      const response = await AuthService.getAccountData();
      this.user = response.data;
    },
    async handleImage(e) {
      this.imageIsSaving = true;
      const image = e.target.files[0];

      if (image.size > 3000000) {
        this.imageIsSaving = false;
        EventBus.$emit('MESSAGE', {
          title: 'Error Uploading Photo',
          message: 'Image must be 3MB or less',
          isError: true,
        });
        return;
      }

      const response = await MiscService.uploadImage(image);
      document.querySelector('#profile-image').setAttribute('src', response.data.profileImage);
      this.imageIsSaving = false;
      // this.$ga.event({
      //   eventCategory: 'User Actions',
      //   eventAction: 'profile picture uploaded',
      //   eventLabel: response.data.profileImage.replace('https://res.cloudinary.com/dormh2fvt/image/upload/', '')
      // });
    },
    async cancelSubscription() {
      this.resetModal();

      this.processing = true;
      this.showModal = true;
      const response = await StripeService.cancelSubscription();
      const message = response.data.message;
      this.processing = false;

      if (message === 'not logged in' || message === 'no user found') {
        this.error = true;
        this.title = 'Error';
        this.message = 'Could not find account. Please login again to retry. If the issues persists please contact support at support@recipesaver.me';
      }

      if (message === 'no sub id') {
        this.error = true;
        this.title = 'Error';
        this.message = 'Could not find subscription. Please contact support at support@recipesaver.me';
      }

      if (message === 'successful cancellation') {
        this.title = 'Subscription Cancelled';
        this.message = 'You may continue using Recipe Saver Lite version and may upgrade again the future.';

        // Reset user data for template
        this.getAccountData();
      }
    },
    confirmDeleteAccount() {
      this.resetModal();

      this.isConfirmDelete = true;
      this.showModal = true;
      this.title = 'WARNING! Are You Sure?';
      this.message = ' Your entire account along with all your recipes will be permanently deleted. If you\'re a Full plan member your subscription will be canceled as well. Do you still wish to proceed?'
    },
    async deleteAccountFinal() {
      this.resetModal();

      this.processing = true;
      const response = await StripeService.deleteAccount();
      const message = response.data.message;
      this.processing = false;

      if (message === 'not logged in') {
        this.error = true;
        this.title = 'Something Went Wrong';
        this.message = 'Please try logging in again first.';
      }

      if (message === 'account deleted') {
        this.error = true;
        this.title = 'Account Deleted';
        this.message = 'Your account (and subscription if you had one) has been deleted.';
      }

      this.showModal = true;
    },
    resetModal() {
      this.error = false;
      this.isConfirmDelete = false;
      this.title = '';
      this.message = '';
    }
  },
  mounted() {
    document.querySelector('#profile-image-input').addEventListener('change', this.handleImage);
  },
  created() {
    this.getAccountData();
  },
  beforeCreate() {
    document.body.className = 'account';
  }
}
</script>

<style lang="scss">
#account {
  header {
    .header-inner {
      width: 100%;
      padding: 0 20px;

      #nav li.search-container {
        display: none;
      }
    }
  }

  #side-nav {
    display: none;

    #add-recipe {
      display: none;
    }

    #side-nav-menu {
      margin-top: 40px;
    }
  }

  #account-container {
    border-radius: 4px;
    background-color: #fff;
    box-shadow: rgba(0, 0, 0, 0.298039) 0px 1px 3px 0px;
    margin: 50px auto 0 auto;
    max-width: 820px;
    padding: 40px;
    display: grid;
    align-items: center;
    grid-template-columns: 30% 1fr;
    box-sizing: border-box;
    min-height: 380px;
    position: relative;

    .account-left {
      position: relative;

      .profile-image-container:hover,
      .profile-image-container.saving {
        #profile-image-overlay {
          display: block;
        }
      }

      .profile-image-container.saving {
        #profile-image-overlay {
          background-image: url(../assets/spinner.gif);
          background-color: rgba(255, 255, 255, 0.9);
          background-repeat: no-repeat;
          background-position: center center;

          .new-profile-image-btn {
            display: none;
          }
        }
      }

      #profile-image,
      #profile-image-overlay {
        border-radius: 50%;
        width: 215px;
        height: 215px;
      }

      #profile-image-overlay {
        display: none;
        background-color: rgba(52, 51, 51, 0.67);
        position: absolute;
        top: 0;
        left: 3px;
        z-index: 5;
        cursor: pointer;

        &:hover {
          .new-profile-image-btn {
            background-color: #23d82f;
          }
        }

        .new-profile-image-btn {
          cursor: pointer;
          background-color: #089de3;
          display: inline-block;
          padding: 12px;
          font-size: 15px;
          outline: none;
          border: none;
          color: #fff;
          margin-top: 90px;
        }
      }
    }

    .account-right {
      text-align: left;
      padding-left: 70px;

      .account-name {
        font-family: 'Merriweather', serif;
        font-size: 32px;
        margin-bottom: 40px;
      }

      .account-info {
        li {
          margin-bottom: 14px;

          label {
            font-family: 'Merriweather', serif;
            line-height: 28px;
            font-weight: bold;
          }
        }
      }
    }

    .upgrade-downgrade-account,
    .delete-account {
      align-self: end;
      text-decoration: underline;
      display: inline-block;

      a:hover {
        color: #000;
      }
    }


    .upgrade-downgrade-account {
      text-align: left;

      a {
        color: #14aaf5;
      }
    }

    .delete-account {
      text-align: right;

      a {
        color: #898e95;
      }
    }
  }

  .account-modal {
    .account-modal-inner {
      position: fixed;
      width: 350px;
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      right: 0;
      margin-left: auto;
      margin-right: auto;
      padding: 20px;
      z-index: 2;
      background-color: white;
      border-radius: 3px 3px 3px 3px;
      border: 1px solid #B9BCC0;
      box-shadow: 0px 2px 3px rgba(0,0,0,0.3);
      max-height: calc(100vh - 203px);
      overflow-y: auto;
      font-family: 'Source Sans Pro', sans-serif;
      text-align: left;

      &.error {
        .account-modal-title {
          color: #dd0000;
        }
      }

      &.processing {
        background: none;
        border: none;
        box-shadow: none;

        .rs-logo .rs-logo-image {
          width: 120px;
          margin-bottom: 12px;
          animation-name: wiggle;
          animation-duration: 2.5s;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }

        .account-processing {
          display: block;
        }
      }

      &.confirm-delete {
        .account-modal-title {
          color: #f00;
        }

        .account-delete-confirm-btn {
          background-color: #f00;

          &:hover {
            background-color: #fff;
            border: solid 1px #f00;
            color: #f00;;
          }
        }

        .account-modal-close {
          color: #000;
          margin-top: 10px;
          background-color: #fff;
          padding: 5px;
        }
      
      }

      .rs-logo {
        text-align: center;

        .rs-logo-image {
          width: 60px;
          margin-bottom: 25px;
        }
      }

      .account-processing {
        display: none;
        text-align: center;
        color: white;
        font-size: 24px;
        letter-spacing: 0.5px;
      }

      .account-modal-title {
        font-weight: bold;
        font-size: 22px;
        margin-bottom: 8px;
      }      

      .account-message {
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 22px;
      }

      .account-modal-cta {
        cursor: pointer;
        display: block;
        width: 100%;
        text-decoration: none;
        padding: 15px 0;
        text-align: center;
        border-radius: 4px;
        background-color: #000;
        color: #fff;
        font-size: 18px;
        border: solid 1px transparent;
        transition: all .15s ease;

        &:hover {
          background-color: #fff;
          border: solid 1px #000;
          color: #000;
        }
      }
    }

    .account-overlay {
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.5);
    }
  }
}

@import '@/styles/_account-mobile.scss';


@keyframes wiggle {
  0% {transform: rotate(0deg);}
  25% {transform: rotate(-25deg);}
  50% {transform: rotate(25deg);}
  75% {transform: rotate(-25deg);}
  100% {transform: rotate(0deg);}
}
</style>

