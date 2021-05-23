import Vue from 'vue'
import App from './App.vue'
import router from './router'
// import VueAnalytics from 'vue-analytics';

Vue.config.productionTip = false
router.beforeEach((to, from, next) => {
  document.title = to.meta.title;
  next();
});


const isProd = process.env.NODE_ENV === 'production';

// Vue.use(VueAnalytics, {
//   id: 'UA-151413018-1',
//   router,
//   // debug: {
//   //   enabled: !isProd,
//   //   sendHitTask: true
//   // }
// });

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
