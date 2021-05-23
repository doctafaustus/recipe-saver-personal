<template>
  <div id="login-register" :class="{ 'login-view': isLoginView, 'login-register-box': true }">

    <div class="main-box">
      <div class="main-header">
        <router-link :to="{ path: '/' }" class="logo-link">
          <img class="logo" src="../assets/logo-255x255.png">
        </router-link>
        <router-link :to="{ path: '/' }" class="logo-link">
          <div class="logo-text">Recipe Saver</div>
        </router-link>
      </div>
      <div class="main-body">
        
        <div class="mode-controller">
          <div :class="{ 'active': isLoginView, 'mode-controller-btn': true }" @click="changeView(true)">Log In</div>
          <div :class="{ 'active': !isLoginView, 'mode-controller-btn': true }" @click="changeView(false)">Sign Up</div>
        </div>

        <div class="main-body-padding">

          <div v-show="!isLoginView" class="terms-msg">
            <span>By signing up you agree to the </span>
            <router-link :to="{ path: '/terms' }" class="terms-link">
              terms and conditions.
            </router-link>
          </div>

          <div class="login-strategies">
            <a class="login-strategy facebook" :href="getLoginOrRegisterURL('facebook')">
              <div class="icon-block"><icon name="facebook"/></div>
              <div v-if="isLoginView" class="login-strategy-text">Log In With Facebook</div>
              <div v-else class="login-strategy-text">Sign Up With Facebook</div>
            </a>
            <a class="login-strategy google" :href="getLoginOrRegisterURL('google')">
              <div class="icon-block"><icon name="google"/></div>
              <div v-if="isLoginView" class="login-strategy-text">Log In With Google</div>
              <div v-else class="login-strategy-text">Sign Up With Google</div>
            </a>
          </div>

          <div class="or">or</div>

          <form class="email-form" @submit.prevent="loginOrRegister()">
            <div v-if="!isLoginView" class="register-fields">
              <div class="login-register-label">Register with Email</div>
              <div class="login-strategy full-name">
                <div class="icon-block"><icon name="avatar"/></div>
                <input id="full-name" class="login-input" type="text" placeholder="Full Name" v-model="fullName" @focus="addHighlight($event)" @blur="removeHighlight($event)">
              </div>
            </div>
            <div v-if="isLoginView" class="login-register-label">Log In with Email</div>
            <div class="login-strategy email">
              <div class="icon-block"><icon name="email"/></div>
              <input id="email" class="login-input" type="email" placeholder="email@example.com" autocomplete="username" v-model="email" @focus="addHighlight($event)" @blur="removeHighlight($event)">
            </div>
            <div class="login-strategy password">
              <div v-if="isLoginView" class="icon-block"><icon name="password"/></div>
              <div v-else class="icon-block"><icon name="key"/></div>
              <input id="password" class="login-input" type="password" placeholder="Password" v-model="password" @focus="addHighlight($event)" @blur="removeHighlight($event)">
            </div>
            <div v-if="!isLoginView" class="login-strategy password-confirm">
              <div class="icon-block"><icon name="password"/></div>
              <input id="password-confirm" class="login-input" type="password" placeholder="Confirm password" v-model="passwordConfirm" @focus="addHighlight($event)" @blur="removeHighlight($event)">
            </div>  

            <router-link v-if="isLoginView" :to="{ path: '/password-recovery' }" class="password-recovery" @click="passwordRecovery = true">
              Password Recovery
            </router-link>
      

            <input type="submit" hidden>
          </form>

          <div v-show="message" v-html="message" class="message"></div>
        </div>
      </div>

      <div class="main-footer" @click="loginOrRegister()">
        <span v-if="isLoginView">Log In</span>
        <span v-else>Register</span>
        <icon name="caret"/>
      </div>
    </div>

  </div>
</template>

<script>
import Icon from '@/components/Icons';
import AuthService from '@/services/AuthService';

export default {
  components: {
    Icon
  },
  data() {
    return {
      email: '',
      password: '',
      passwordConfirm: '',
      message: '',
      fullName: '',
      isLoginView: true,
      errors: [],
      queryMessages: {
        'not-recognized': 'Sorry, we have no record for this account. If you wish to sign up please click the Sign Up tab above.',
        'login-again': 'Please login again.',
        'already-registered': 'This account is already registered. Please login.',
        'fb-already-registered': 'This account is already registered. To register a new Facebook account please log into your account at Facebook and try again.',
        'password-reset': 'Your password has been successfully reset. Please login to continue.'
      },
    };
  },
  methods: {
    getLoginOrRegisterURL(strategy) {
      if (this.isLoginView) return `/auth/${strategy}/${this.isLoginView ? 'login' : 'register'}`;
      else return `/auth/${strategy}/${this.isLoginView ? 'login' : 'register'}`;
    },
    changeView(isLoginView) {
      this.message = '';
      this.email = '',
      this.password = '',
      this.isLoginView = isLoginView;
    },
    addHighlight(e) {
      e.target.closest('.login-strategy').classList.add('highlight');
    },
    removeHighlight(e) {
      e.target.closest('.login-strategy').classList.remove('highlight');
    },
    isValidLogin() {
      return this.email.trim().length && this.password.trim().length;
    },
    isValidEmail(email) {
      const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
    },
    isValidRegistration() {
      this.errors = [];

      // Force new users to use Google strategy if they've entered a gmail address
      // if (this.email.indexOf('@gmail') > -1) {
      //   this.errors.push('Please use "Sign Up With Google" above to proceed');
      //   return false;
      // }

      if (!this.fullName.length) this.errors.push('Name required');
      else if (this.fullName.length > 50) this.errors.push('Name must be less than 50 characters');

      if (!this.email.length) this.errors.push('Email required');
      else if (!this.isValidEmail(this.email)) this.errors.push('Invalid email');
      else if (this.email.length > 60) this.errors.push('Email must be less than 60 characters');

      if (!this.password.length) this.errors.push('Password required');
      else if (this.password !== this.passwordConfirm) this.errors.push('Passwords must match');
      else if (this.password.length < 8) this.errors.push('Password must be 8 or more characters');
      else if (this.password.length > 30) this.errors.push('Password must be 30 characters or less'); 

      if (!this.errors.length) return true;
    },
    loginOrRegister() {
      if (this.isLoginView) this.login();
      else this.register();
    },
    async login() {
      if (!this.isValidLogin()) {
        this.message = 'Invalid login - please try again.';
        return;
      }
      this.message = '';
      const response = await AuthService.login({ email: this.email.toLowerCase().trim(), password: this.password });

      if (response.data.errMessage) this.message = response.data.errMessage;
      if (response.data.userID) {
        this.$router.push('/recipes/all');
      }
    },
    async register() {
      if (!this.isValidRegistration()) {
        this.message = this.errors.join('<br>');
        return;
      }

      this.message = '';
      const response = await AuthService.register({ 
        fullName: this.fullName,
        email: this.email.toLowerCase().trim(),
        password: this.password
      });
      if (response.data.errMessage) this.message = response.data.errMessage;
      if (response.data.userID) {
        this.$router.push('/plans');
      }
    },
    checkQueryMessages(queryValue) {
      if (this.$route.query[queryValue]) {
        this.message = this.queryMessages[this.$route.query[queryValue]];
      }
    }
  },
  mounted() {
    this.checkQueryMessages('login-reg-msg');
    
    // Show Register view if parameter exits (coming from homepage links)
    if (this.$route.query['show-reg']) {
      this.isLoginView = false;
    }

    window.scrollTo(0,0);
  },
  beforeCreate() {
    document.body.className = 'login-register';
  }
}
</script>

<style lang="scss">
@import '@/styles/_login-register-box.scss';
#login-register {
  .main-box {
    .main-body {
      .mode-controller {
        display: flex;
        flex-direction: row;
        align-items: stretch;

        .mode-controller-btn {
          flex: 1;
          padding: 20px 0;
          cursor: pointer;
          font-size: 16px;

          &.active {
            border-bottom: solid 1px #000;
            font-weight: bold;
            background-color: #e5e5e5
          }
        }
      }

      .main-body-padding {
        padding: 20px;

        .terms-msg {
          color: #878787;
          font-size: 12px;
          font-style: italic;
          margin-bottom: 10px;

          .terms-link {
            color: #000;
          }
        }
      }

      .login-strategies,
      .email-form {
        .login-register-label {
          margin-bottom: 10px;
          font-weight: 600;
        }

        .login-strategy {
          width: 100%;
          display: block;
          height: 50x;
          display: flex;
          align-items: center;
          color: #fff;
          text-decoration: none;
          transition: 300ms;
          border-radius: 3px;

          &:hover {
            filter: brightness(125%);
          }

          &.facebook {
            background-color: #4267b2;
            margin-bottom: 10px;

            .icon-block {
              background-color: #283f6b;
            }
          }

          &.google {
            background-color: #ea4335;

            .icon-block {
              background-color: #d02b1d;
            }
          }

          &.full-name,
          &.email,
          &.password,
          &.password-confirm {
            border: solid 1px #e5e5e5;

            &:hover {
              filter: none;
            }

            &.highlight {
              border: solid 1px #a6c8ff;
            }

            .icon-block {
              background-color: #e5e5e5;
            }
          }

          &.full-name,
          &.email,
          &.password {
            margin-bottom: 10px;
          }

          .icon-block {
            display: inline-block;
            height: 50px;
            box-sizing: border-box;
            border-radius: 3px 0 0 3px;

            .icon {
              height: 50px;
              width: 50px;
              display: flex;

              svg {
                width: 50px;
                align-self: center;
                fill: #fff;
              }
            }

            .icon--facebook svg {
              height: 21px;
            }

            .icon--google svg {
              height: 24px;
            }

            .icon--avatar svg {
              height: 22px;
              fill: #888;
            }

            .icon--email svg {
              height: 12px;

              path {
                fill: #888;
              }
            }

            .icon--key svg {
              height: 23px;
              fill: #888;
            }

            .icon--password svg {
              height: 16px;
            }
          }

          .login-strategy-text {
            padding: 0 15px;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 0.3px;
          }

          #full-name, 
          #email,
          #password,
          #password-confirm {
            height: 40px;
            box-sizing: border-box;
            width: 100%;
            outline: none;
            border: none;
            padding-left: 10px;
            font-size: 15px;
          }
        }

        .password-recovery {
          width: 140px;
          text-align: left;
          display: block;
          text-decoration: underline;
          color: #000;
          cursor: pointer;
        }
      }

      .or {
        margin: 20px 0;
        color: rgba(0,0,0,0.54);
      }
    }

    .message {
      text-align: left;
      margin-top: 10px;
      color: #fff;
      padding: 10px;
      line-height: 20px;
      background-color: #673ab7;
    }

    .main-footer {
      cursor: pointer;
      box-sizing: border-box;
      background-color: #089de3;
      color: #fff;
      padding: 30px;
      border-radius: 0 0 6px 6px;
      text-transform: uppercase;
      font-size: 18px;
      border-bottom: solid 1px #089de3;
      letter-spacing: 0.5px;

      &:hover {
        filter: brightness(120%);
      }

      .icon--caret {
        height: 15px;
        width: 15px;
        transform: rotate(270deg);
        position: relative;
        top: -2px;
        margin-left: 6px;
      }
    }
  }

  @media (max-width: 767px) {
    padding: 40px 0;
    height: auto;

    #full-name,
    #email,
    #password,
    #password-confirm {
      font-size: 16px !important;
    }

    .main-box {
      .main-header {
        padding: 12px;

        .logo {
          width: 45px;
        }

        .logo-text {
          font-size: 20px;
        }
      }

      .main-body {
        .or {
          display: none;
        }

        .mode-controller {
          .mode-controller-btn {
            padding: 14px 0;
          }
        }

        .login-strategies {
          .login-strategy {
            .icon-block {
              height: 40px;

              .icon {
                height: 40px;
                width: 40px;
              }
            }
          }
        }

        .email-form {
          margin-top: 18px;

          .login-strategy .icon-block {
            height: 40px;
            
            .icon {
              height: 40px;
              width: 40px;
            }
          }
        }
      }

      .main-footer {
        padding: 18px;
      }
    }
  }
}
</style>

