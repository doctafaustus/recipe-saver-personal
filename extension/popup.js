// Set dev or prod site
// const mode = 'prod';
const mode = 'prod';
const site = (mode === 'prod') ? 'https://recipe-saver-personal.herokuapp.com' : 'https://localhost:8080';

// Get whitelisted sites
const whiteListedSites = getWhiteListedSites();

// Declare elements
const moreEl = document.querySelector('#more');
const form = document.querySelector('#recipe-form');
const titleInput = document.querySelector('#title');
const imageEl = document.querySelector('#image');
const urlInput = document.querySelector('#url');
const descEl = document.querySelector('#description');
const tagsInput = document.querySelector('#tags');
const initialViewEl = document.querySelector('#initial-view');
const successEl = document.querySelector('#success');
const errorEl = document.querySelector('#error');
const signUpStart = document.querySelector('#sign-up-start');
const logoLink = document.querySelector('#logo');
const myRecipesLink = document.querySelector('#my-recipes');
const welcomeSignInLink = document.querySelector('#welcome-sign-in');
const viewLink = document.querySelector('#view-link');
const signInLink = document.querySelector('#sign-in');
const scrapedEl = document.querySelector('#scraped');
let rs_id = null;


let recipeStorage;
chrome.storage.local.get('recipeStorage', storage => {
  console.log('storage', storage);
  if (isEmptyObj(storage)) recipeStorage = {};
  else recipeStorage = storage.recipeStorage;
  init();
});

const dataInputs = [titleInput, urlInput, descEl, tagsInput];

function saveDataToObj() {
  dataInputs.forEach(input => {
    recipeStorage[input.id] = input.value;
  });
  if (imageEl.getAttribute('src') !== 'https://res.cloudinary.com/dormh2fvt/image/upload/v1527317481/placeholder_rjy55k.jpg') {
    recipeStorage.image = imageEl.getAttribute('src');
  }
}

function populateInputs() {
  dataInputs.forEach(input => {
    input.value = recipeStorage[input.id] || '';
  });
  if (recipeStorage.image) {
    imageEl.setAttribute('src', recipeStorage.image) 
  } else document.querySelector('#title-and-image').classList.add('no-image');
}

function isEmptyObj(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}


// Update link destinations based on site setting
updateLinks();

// Show "More Details" on click
moreEl.addEventListener('click', () => {
  moreEl.style.display = 'none';
  document.querySelector('#extra-data').style.display = 'block';
});

// Handle form submit
form.addEventListener('submit', e => {
  e.preventDefault();
  sendToRS();
});

// Send "opened" flag to background script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.runtime.sendMessage({ 
    category: 'track',
    popupOpenedTab: tabs[0].id
  });
});


// When popup.us opens, send message to content script to extract recipe data
// On response, populate the extension form with the returned data
function init() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {


    // Check for rs_id first, show login link if there's no id
    chrome.storage.sync.get('rs_id', storage =>  {
      rs_id = storage.rs_id;
      // console.log(rs_id);

      if (!rs_id) {
        showSignUpMessage();
      } else {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          const currentTabData = tabs[0];
          const a = document.createElement('a');
          a.href = currentTabData.url;
          const currentHost = a.host.replace(/^www\./, '');
          const siteIsWhiteListed = whiteListedSites.indexOf(currentHost) > -1;

          // Save recipe data in storage
          dataInputs.forEach(input => {
            input.addEventListener('blur', e => {
              saveDataToObj();
              recipeStorage.tabID = currentTabData.id;
              chrome.runtime.sendMessage({ 
                category: 'saveStorage',
                recipeStorage
              });
            });
          });

          // If there is storage data to populate do that instead of scraping
          if (!isEmptyObj(recipeStorage) && recipeStorage.tabID === currentTabData.id) {
            populateInputs();
            moreEl.click();
            return console.log('Populating from storage');
          }

          if (siteIsWhiteListed) {
            chrome.tabs.sendMessage(tabs[0].id, {rsAction: 'extract'}, function(response) {
              console.info('Response', response);
              processResponse(response);
            });
          } else {
            console.log('Not whitelisted');
            processResponse({
              url: currentTabData.url,
              title: currentTabData.title,
              scraped: false
            });
          }
        });
      }
    });
  });
}


function processResponse(response) {
  if (!response) return console.log('No response');

  // Title
  if (response.title) {
    titleInput.value = response.title;
  }

  // Image
  if (response.img) {
    imageEl.style.display = 'block';
    imageEl.setAttribute('src', response.img);
  } else {
    document.querySelector('#title-and-image').classList.add('no-image');
  }

  // URL
  if (response.url) {
    urlInput.value = response.url;
  }

  // Ingredients / Description
  if (response.desc && response.ing) {    

    const ingredients = response.ing.join('\n');
    const description = response.desc.join('\n\n');

    descEl.value = `${ingredients}\n\n\n${description}`;
    moreEl.click();
  }

  // Scraped
  scrapedEl.value = response.scraped;
}

// Send data to server
function sendToRS() {
  const data = {
    user_id: null,
    title: titleInput.value,
    description: descEl.value.replace(/\n/g, '<br>'),
    url: urlInput.value,
    image: (imageEl.style.display === 'block') ? imageEl.getAttribute('src') : null,
    scraped: scrapedEl.value
  };

  data.user_id = rs_id;

  const tagsSplit = tagsInput.value.split(',');
  const tagsFiltered = tagsSplit.filter(tag => {
    if (tag.trim().length) {
      return true;
    }
  });
  const tagsTrimmed = tagsFiltered.map(tag => tag.trim());
  data.tags = tagsTrimmed;


  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${(mode === 'dev') ? 'https://localhost:8081' : 'https://recipe-saver-personal.herokuapp.com'}/api/extension`, true);
  xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8',);
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
      chrome.storage.local.set({ recipeStorage: {} });

      initialViewEl.style.display = 'none';

      if (JSON.parse(xhr.responseText) && JSON.parse(xhr.responseText).message === 'Limit reached') {
        errorEl.style.display = 'block';
        errorEl.querySelector('#error-title').textContent = 'Paid Feature';
        errorEl.querySelector('#sign-in-error').innerHTML = 'To save more than 5 recipes you\'ll need to upgrade your account on your Account page.'
      } else {
        successEl.style.display = 'block';
        viewLink.setAttribute('href', `${site}/recipes/all?id=${JSON.parse(xhr.responseText)._id}`);
        console.log('test', `${site}/recipes/all?id=${JSON.parse(xhr.responseText)._id}`);
      }

    } else if (xhr.readyState === 4 && xhr.status === 401) {
      initialViewEl.style.display = 'none';
      errorEl.style.display = 'block';
      console.log('Error:', xhr.responseText, xhr.status);
    } else if (xhr.readyState === 4) {
      initialViewEl.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.querySelector('#error-title').textContent = 'Oops';
      errorEl.querySelector('#sign-in-error').innerHTML = 'Something went wrong. Try signing into your account first.'
    }
  }
  xhr.send(JSON.stringify(data));
}

// Show initial sign up message
function showSignUpMessage() {
  initialViewEl.style.display = 'none';
  signUpStart.style.display = 'block';
}

function updateLinks() {
  logoLink.setAttribute('href', `${site}`);
  myRecipesLink.setAttribute('href', `${site}/recipes`);
  welcomeSignInLink.setAttribute('href', `${site}/login`);
  signInLink.setAttribute('href', `${site}/login`);
}


function getWhiteListedSites() {
  return [
    'allrecipes.com.au',
    'allrecipes.com',
    'parade.com',
    'cooking.nytimes.com',
    'emerils.com',
    'food52.com',
    'hugsandcookiesxoxo.com',
    'recipes.sparkpeople.com',
    'smittenkitchen.com',
    'tastykitchen.com',
    'thepioneerwoman.com',
    'jenelizabethsjournals.com',
    'whiteonricecouple.com',
    'aspicyperspective.com',
    'budgetbytes.com',
    'chowhound.com',
    'cooks.com',
    'deliaonline.com',
    'finecooking.com',
    'foodrepublic.com',
    'geniuskitchen.com',
    'forkly.com',
    'inspiredtaste.net',
    'jamieoliver.com',
    'justataste.com',
    'kingarthurflour.com',
    'myfoodandfamily.com',
    'laaloosh.com',
    'marthastewart.com',
    'marthastewart.com',
    'mrfood.com',
    'pauladeen.com',
    'ricekrispies.com',
    'seriouseats.com',
    'simplyrecipes.com',
    'sixsistersstuff.com',
    'skinnytaste.com',
    'taste.com.au',
    'tasteofhome.com',
    'the-girl-who-ate-everything.com',
    'themediterraneandish.com',
    'thereciperebel.com',
    'thespruceeats.com',
    'twopeasandtheirpod.com',
    'vegetariantimes.com',
    'weightwatchers.com',
    'wholefoodsmarket.com',
    'williams-sonoma.com',
    'foodnetwork.com',
    'foodnetwork.ca',
    'yummly.com',
    'bonappetit.com',
    'epicurious.com',
    'bettycrocker.com',
    'pillsbury.com',
    'tablespoon.com',
    'countryliving.com',
    'delish.com',
    'esquire.com',
    'goodhousekeeping.com',
    'womansday.com',
    'bhg.com',
    'eatingwell.com',
    'rachaelraymag.com',
    'cookingchanneltv.com',
    'cookinglight.com',
    'myrecipes.com',
    'foodandwine.com',
    'health.com',
    'realsimple.com',
    'southernliving.com',
    'tasty.co',
    'hellofresh.com',
    'thekitchn.com',
    'bbc.com',
    'wellplated.com',
    'pinchofyum.com',
    'traderjoes.com'
  ];
}

