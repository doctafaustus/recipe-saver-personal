<template>
  <div id="plans">
    <div class="plans-container wrapper">
      <HeaderNonApp></HeaderNonApp>

      <div class="plans-container-title">
        <h1>Plans built for home cooks of all types.</h1>
        <h2>Sign up for the full service or upgrade later.</h2>
      </div>
      <div class="plan-blocks">

        <div class="plan-container">
          <div class="plan lite">
            <div class="plan-title-and-icon">
              <img class="plan-title-icon" src="../assets/icon-emerald.png">
              <div class="plan-title">Lite</div>
            </div>
            <div class="plan-info">
              <div class="plan-subtitle">
                Save and organize online recipes
              </div>
              <div class="plan-price">Free</div>
              <div class="plan-price-info">upgrade later</div>
              <ul class="plan-benefits">
                <li>Save up to 5 recipes</li>
                <li>Recipe Saver Chrome extension</li>
                <li>Add custom notes, images, and tags</li>
              </ul>
            </div><a class="plan-cta" href="#" @click.prevent="showLitePlan()">Select</a>
          </div>
        </div>

        <div class="plan-container">
          <div class="plan full">
            <div class="plan-title-and-icon">
              <img class="plan-title-icon" src="../assets/icon-ruby.png">
              <div class="plan-title">Full</div>
            </div>
            <div class="plan-info">
              <div class="plan-subtitle">
                The ultimate recipe <br>organization tool and more
              </div>
              <div class="plan-price">$20</div>
              <div class="plan-price-info">per year</div>
              <ul class="plan-benefits">
                <li>All the benefits of the Lite plan</li>
                <li>Save unlimited recipes</li>
                <li>Share recipes with friends and family</li>
                <li>Create grocery lists (coming soon!)</li>
              </ul>
            </div><a class="plan-cta" href="#">Select</a>
          </div>
        </div>

      </div>
    </div>

    <Footer></Footer>

    <div v-show="showModal" class="charge-modal">
      <div class="charge-modal-inner" :class="{ 'error': error, 'processing': processing === true, 'charge-modal-inner': true }">
        <div class="rs-logo">
          <img class="rs-logo-image" src="../assets/logo-255x255.svg">
        </div>
        <div class="charge-processing">Processing...</div>
        <div class="charge-modal-title">{{ title }}</div>
        <div class="charge-message">{{ message }}</div>
        <router-link v-show="btnToShow === 'login'" :to="{ path: '/login' }" class="charge-modal-btn">Login / Register</router-link>
        <router-link v-show="btnToShow === 'recipes'" :to="{ path: '/recipes/all' }" class="charge-modal-btn">My Recipes</router-link>
        <div class="charge-modal-cancel-container" v-show="title !== ''">
          <div class="charge-modal-cancel" @click="showModal = false">Cancel</div>
        </div>
      </div>

      <div class="charge-overlay"></div>
    </div>

  </div>
</template>

<script>
import HeaderNonApp from '@/components/HeaderNonApp.vue';
import Icon from '@/components/Icons';
import utils from '@/mixins/utils';
import Footer from '@/components/Footer.vue';
import StripeService from '@/services/StripeService';


export default {
  components: {
    HeaderNonApp,
    Icon,
    Footer
  },
  mixins: [utils],
  data() {
    return {
      processing: false,
      title: '',
      message: '',
      error: false,
      showModal: false,
      btnToShow: '',
    };
  },
  methods: {
    resetModal() {
      this.title = '';
      this.message = '';
      this.error = false;
      this.btnToShow = '';
    },
    showLitePlan() {
      this.resetModal();
      this.showModal = true;
      this.processing = true;

      // Simulate loading just for effect (Full plans won't be affected)
      setTimeout(() => {
        this.processing = false;
        this.title = 'Welcome to Recipe Saver!';
        this.message = 'Your account is all set up! Click "My Recipes" below to access your personal recipe collection.'
        this.btnToShow = 'recipes';
      }, 2000);

      // this.$ga.event({
      //   eventCategory: 'Plans',
      //   eventAction: 'free plan clicked'
      // });
    },
    handleResponse(response) {

      this.processing = false;
      const noChargeText = 'Your card has not been charged.';

      this.title = 'Unsuccessful Purchase';
      this.error = true;
      this.btnToShow = 'login';
      
      switch(response.data.message) {
        case 'not logged in':
          this.message = `Please login or register first. ${noChargeText}`;
          // this.$ga.event({
          //   eventCategory: 'Plans',
          //   eventAction: 'full plan error',
          //   eventLabel: this.message
          // });
          break;
        case 'no user found':
          this.message = `User not found. Please login first. ${noChargeText}`;
          // this.$ga.event({
          //   eventCategory: 'Plans',
          //   eventAction: 'full plan error',
          //   eventLabel: this.message
          // });
          break;
        case 'has full plan':
          this.message = `This account already has a Full Plan. ${noChargeText}`;
          this.btnToShow = 'recipes';
          // this.$ga.event({
          //   eventCategory: 'Plans',
          //   eventAction: 'full plan error',
          //   eventLabel: this.message
          // });
          break;
        case 'new subscription':
          this.title = 'You\'re In!';
          this.message = 'Congratulations! You have successfully signed up for the Full plan and now have unlimited access';
          this.btnToShow = 'recipes';
          this.error = false;
          // this.$ga.event({
          //   eventCategory: 'Plans',
          //   eventAction: 'full plan signup',
          // });
          break;
      }

      this.showModal = true;
    }
  },
  mounted() {

    const component = this;
    const publicKey = window.location.origin.includes('recipe-saver-personal.herokuapp.com') ? 'pk_live_51HbpZpD9ukuHTF1f3t6I6YWG0PPnQvyZUNQh802R9lmsqK1COMgHHfZRROfddXSdf1qrHSirIOUSrnq6AUDhtE0L002k9uY9Ls' : 'pk_test_51HbpZpD9ukuHTF1fnM8DQHlp45Zqwl0lwDN5kiQiJOoHFhgRFr6KJbGRLDWmNz756fSBpVeNzU8n9mkvIaz4AzuB00bAeZKycE';

    // Test CC #: 4242424242424242
		const handler = StripeCheckout.configure({
			key: publicKey,
			image: 'https://res.cloudinary.com/dormh2fvt/image/upload/v1572928163/rs-site-images/stripe-logo.png',
			locale: 'auto',
			async token(token) {

        component.processing = true;
        component.showModal = true;
        
        const response = await StripeService.charge({
          stripeToken: token.id,
          stripeEmail: token.email
        });

        component.handleResponse(response);
			}
		});

    document.querySelector('.plan.full .plan-cta').addEventListener('click', e => {
      e.preventDefault();
      
			handler.open({
				name: 'Recipe Saver',
				description: 'Full Plan',
				amount: 2000,
				allowRememberMe: false,
      });
      
      // this.$ga.event({
      //   eventCategory: 'Plans',
      //   eventAction: 'full plan clicked'
      // });
    });

  },
  beforeCreate() {
    document.body.className = 'plans';
  }
}
</script>

<style lang="scss">
#plans {
  background-image: url(../assets/bg-guacamole.jpg);
  background-size: cover;

  header.non-app {
    background: transparent;
    box-shadow: none;

    nav .nav-item a:hover {
      color: #3ecf8e;
    }
  }

  .wrapper {
    max-width: 1040px;
    margin: 0 auto;
  }

  .plans-container {
    position: relative;
    margin: 0 auto 200px auto;

    .plans-container-title {
      margin-top: 100px;
      margin-bottom: 66px;
      text-shadow: 2px 2px 3px #515151;
      
      h1 {
        color: #fff;
        font-size: 42px;
        margin-bottom: 8px;
      }

      h2 {
        color: #bdc6ff;
        font-size: 32px;
      }
    }

    .plan-blocks {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;

      .plan-container {
        margin: 0 30px;

        .plan {
          background-color: #fff;
          border-radius: 4px;
          box-shadow: 0 15px 35px rgba(50,50,93,.1), 5px 5px 15px rgba(0,0,0,.07);
          transition: all .25s ease;

          &.full {
            box-shadow: 0 0 12px 5px rgba(216, 27, 96, 0.6);

            &:hover {
              box-shadow: 0 0 12px 5px rgba(36, 180, 126, 0.7490196078431373)
            }

            .plan-title-and-icon {
              .plan-title-icon {
                width: 20px;
                height: 20px;
                transform: rotate(45deg);
                position: relative;
                top: -3px;
              }
            }

            .plan-info {
              .plan-price {
                font-size: 62px;
                color: #24b47e;
              }
            }

            .plan-cta {
              background-color: #fe4081;

              &:hover {
                background-color: #24b47e;
              }
            }
          }

          .plan-title-and-icon {
            padding: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-bottom: solid 1px #e6ebf1;

            .plan-title-icon {
              width: 17px;
              height: 20px;
              margin-right: 14px;
            }

            .plan-title {
              text-transform: uppercase;
              font-weight: bold;
              color: #4db6ac;
              font-size: 20px;
              letter-spacing: 0.3px;
            }
          }

        .plan-info {
          padding: 40px;

          .plan-subtitle {
            font-size: 23px;
            line-height: 30px;
            color:#525f7f;
            margin-bottom: 20px;
          }

          .plan-price {
            font-size: 40px;
            color: #9eb0ae;
            margin-bottom: 10px;
            text-transform: uppercase;
          }

          .plan-price-info {
            color: #8898aa;
            margin-bottom: 50px;
          }

          .plan-benefits {
            text-align: left;
            color: #525f7f;
            padding-left: 42px;
            display: inline-block;

            li {
              margin-bottom: 16px;
              font-size: 17px;
              line-height: 22px;
              position: relative;

              &::before {
                content: '';
                background-image: url(../assets/icon-radish.png);
                height: 31px;
                width: 31px;
                display: inline-block;
                background-size: 31px 31px;
                position: absolute;
                left: -44px;
                top: -6px;
              }
            }
          }
        }

          .plan-cta {
            padding: 25px;
            text-align: center;
            display: block;
            background-color: #9eb0ae;
            font-size: 23px;
            color: #fff;
            text-decoration: none;
            border-radius: 0 0 4px 4px;
            transition: all .25s ease;

            &::after {
              content: '';
              background-image: url(../assets/arrow-long.png);
              display: inline-block;
              height: 20px;
              width: 28px;
              background-repeat: no-repeat;
              position: relative;
              top: 9px;
              margin-left: 10px;
            }

            &:hover {
              background-color: #000;
            }
          }
        }
      }
    }
  }

  .charge-modal {
    .charge-modal-inner {
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
        .charge-modal-title {
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

        .charge-processing {
          display: block;
        }
      }

      .rs-logo {
        text-align: center;

        .rs-logo-image {
          width: 60px;
          margin-bottom: 25px;
        }
      }

      .charge-processing {
        display: none;
        text-align: center;
        color: white;
        font-size: 24px;
        letter-spacing: 0.5px;
      }

      .charge-modal-title {
        font-weight: bold;
        font-size: 22px;
        margin-bottom: 8px;
      }      

      .charge-message {
        font-size: 16px;
        margin-bottom: 30px;
        line-height: 22px;
      }

      .charge-modal-btn {
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

      .charge-modal-cancel-container {
        color: #606060;
        text-align: center;
        margin-top: 20px;

        .charge-modal-cancel {
          display: inline-block;
          cursor: pointer;

          &:hover {
            color: #000;
          }
        }
      }
    }

    .charge-overlay {
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

@media (max-width: 788px) {
  #plans {
    background-size: initial;

    .plans-container {
      margin-bottom: 100px;

      .plans-container-title {
        padding: 0 20px;
        margin-top: 70px;

        h1 {
          font-size: 38px;
        }

        h2 {
          font-size: 26px;
        }
      }

      .plan-blocks {
        grid-template-columns: 1fr;

        .plan-container {
          &:first-child {
            order: 2;
          }

          &:last-child {
            order: 1;
            margin-bottom: 60px;
          }
        }
      }
    }

    .charge-modal .charge-modal-inner {
      width: 90%;
      box-sizing: border-box;
    }
  }
}

@keyframes wiggle {
  0% {transform: rotate(0deg);}
  25% {transform: rotate(-25deg);}
  50% {transform: rotate(25deg);}
  75% {transform: rotate(-25deg);}
  100% {transform: rotate(0deg);}
}
</style>

