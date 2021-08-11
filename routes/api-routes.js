const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Recipe = require('../models/recipe');
const User = require('../models/user');
const cloudinary = require('cloudinary');
const fs = require('fs');
const loggedIn = require('../middleware/logged-in');
const ogs = require('open-graph-scraper');

// Config variables
const cloudinarySecret = process.env.PORT ? process.env.CLOUDINARY_SECRET : fs.readFileSync(`${__dirname}/../private/cloudinary_secret.txt`).toString();
cloudinary.config({ 
  cloud_name: 'dzynqn10l', 
  api_key: '118568662192166', 
  api_secret: cloudinarySecret 
});
const cloudinaryOptionsRecipe = { quality: 60, gravity: 'center', height: 570, width: 570, crop: 'fill', tags: ['recipe_saver'] };
const cloudinaryOptionsProfile = Object.assign(cloudinaryOptionsRecipe, { tags: 'rs_profile_img', folder: 'recipe-saver-personal' });
const recipeLimit = 5;



module.exports = function(app) {

  // Extension posts
  app.post('/api/extension', (req, res) => {
    User.findOne({ _id: req.body.user_id }, (err, user) => {
      if (!user) return res.sendStatus(401);
      Recipe.find({ user_id: req.body.user_id }, (err, recipes) => {

        // Check recipe limit
        if (recipes.length >= recipeLimit && !hasPaidPlan(user)) {
          return res.json({ message: 'Limit reached' });
        }

        const data = req.body;
        let ogImage;

        // If recipe was not scarped then check for og:image
        if (!data.scraped !== 'true') { // Note that this value is a string
          console.log('no scraped');
          ogs({ 'url': req.body.url, 'timeout': 4500 }, (error, results) => {
            ogImage = results.data && results.data.ogImage && results.data.ogImage.url;
            processRecipe(ogImage);
          });
        } else processRecipe();

        function processRecipe(ogImageToUpload) {
          const newRecipe = new Recipe(data);
          
          // Give tags the default color
          // Note: This will be overwritten client-side by the dynamicBackgroundColor utility
          const coloredTags = data.tags.map(tag => {
            return { name: tag, color: '#000000' };
          });
          newRecipe.tags = coloredTags;
          newRecipe.favorite = false;
        
          console.log('ogImageToUpload', ogImageToUpload);
          if (data.image || ogImageToUpload) {
            cloudinary.uploader.upload(data.image || ogImageToUpload, result => {
              console.log('cloudinary upload:', result.secure_url);
              newRecipe.image = result.secure_url;
              saveRecipe(newRecipe);
            },
            cloudinaryOptionsRecipe);
          } else {
            console.log('NO iamge');
            saveRecipe(newRecipe);
          }
        }
      });
    });

    function saveRecipe(recipe) {
      recipe.save((err, recipe) => {
        if (err) console.error(err);
        res.json(recipe);
      });
    }
  });

  // Get user data (id for extension, plan type for sharing feature)
  app.get('/api/user-info', loggedIn, (req, res) => {
    console.log('/api/user-info');
    User.findOne({ _id: req.session.passport.user._id }, (err, user) => {
      const rs_id = user._id;
      const isPaidPlan = hasPaidPlan(user);

      res.json({ rs_id, isPaidPlan });
    });
  });

  // Fetch all recipes
  app.get('/api/recipes/all', loggedIn, (req, res) => {

    Recipe.find({ user_id: req.session.passport.user._id }, 'title creationDate image', (err, recipes) => {
      if (err) console.error(err);
      res.send(recipes);
    })
    .collation({ locale: 'en' })
    .sort(sortObj(req.query.sort));

  });


  // Fetch favorites recipes
  app.get('/api/recipes/favorites', loggedIn, (req, res) => {
    Recipe.find({user_id: req.session.passport.user._id, favorite: true}, 'title creationDate image', (err, recipes) => {
      if (err) console.error(err);
      res.send(recipes);
    })
    .collation({ locale: 'en' })
    .sort(sortObj(req.query.sort));
  });


  // Fetch untagged recipes
  app.get('/api/recipes/untagged', loggedIn, (req, res) => {
    Recipe.find({user_id: req.session.passport.user._id, tags: {$size: 0}}, 'title creationDate image', (err, recipes) => {
      if (err) console.error(err);
      res.send(recipes);
    })
    .collation({ locale: 'en' })
    .sort(sortObj(req.query.sort));
  });


  // Fetch tag
  app.get('/api/recipes/tag/:tagName', loggedIn, (req, res) => {
    const { tagName } = req.params;

    Recipe.find({user_id: req.session.passport.user._id, tags: { '$elemMatch': { 'name': tagName }}}, 'title creationDate image', (err, recipes) => {
        if (err) console.error(err);
        res.send(recipes);
    })
    .collation({ locale: 'en' })
    .sort(sortObj(req.query.sort));
  });


  // Change tag color
  app.post('/api/tag-color', loggedIn, (req, res) => {
    const { tagToUpdate, newColor } = req.body;

    Recipe.find({user_id: req.session.passport.user._id, 'tags.name': tagToUpdate}, (err, recipes) => {

      saveRecipes(recipes);
    
      async function saveRecipes(recipes) {
        for (const recipe of recipes) {
          const targetTag = recipe.tags.find(tag => tag.name === tagToUpdate);
          targetTag.color = newColor;
          recipe.markModified('tags');
          await saveRecord(recipe);
        }

        res.json(recipes);
      }

      function saveRecord(doc) {
        return new Promise((resolve, reject) => {
          doc.save((err, saved) => {
            if (err) reject(err);
            resolve(saved);
          });
        });
      }
    });
  });


  // Fetch tags
  app.get('/api/tags', loggedIn, (req, res) => {

    const { search } = req.query;

    Recipe.find({user_id: req.session.passport.user._id}, (err, recipes) => {
      if (err) console.error(err);

      let tags = [];
      const tagTracker = [];

      recipes.forEach(recipe => {
        if (!recipe.tags.length) return;
        recipe.tags.forEach(tag => {
          
          // If the tag was not already in the tag tracker add it to our tags
          const index = tagTracker.indexOf(tag.name);
          if (index === -1) {
            tag.count = 1;
            tags.push(tag);
            tagTracker.push(tag.name);
          } else {
            tags[index].count++;
          }
        });
      });

      if (search && search !== 'null') { // Note that null will be a string
        tags = tags.filter(tag => {
          return tag.name.indexOf(search) > -1;
        });
      }

      res.send(tags);
    });
  });


  // Get single recipe
  app.get('/api/recipe/:recipeID', loggedIn, (req, res) => {
    const { recipeID } = req.params;

    Recipe.findOne({ user_id: req.session.passport.user._id, _id: recipeID}, (err, recipe) => {
      if (err) console.error(err);
      res.send(recipe);
    });
  });


  // Search for recipes/tags 
  app.get('/api/search/:term', loggedIn, (req, res) => {

    const { term } = req.params;

    Recipe.find({ user_id: req.session.passport.user._id }, 'id title tags', { sort: { title: 1 }}, (err, recipes) => {
      if (err) console.error(err);

      const recipeResults = [];
      const tagResults = [];

      recipes.forEach(recipe => {
        // Capture recipe results
        if (recipe.title.toLowerCase().indexOf(term.toLowerCase()) > -1) {
          recipeResults.push(recipe);
        }

        // Capture tag reults
        recipe.tags.forEach(tag => {
          if (tag.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
            const isCaptured = tagResults.some(tagResult => tagResult.name.toLowerCase() === tag.name.toLowerCase());
            if (!isCaptured) tagResults.push(tag);
          }
        });
      });

      // Sort results by name first
      recipeResults.sort((a, b) => sortFn(a, b, 'title'));
      tagResults.sort((a, b) => sortFn(a, b, 'name'));

      function sortFn(a, b, criteria) {
        if (a[criteria].toLowerCase() < b[criteria].toLowerCase()) return -1; 
        if (a[criteria].toLowerCase() > b[criteria].toLowerCase()) return 1; 
        return 0;
      }

      // Move exact matches to the top of the list
      recipeResults.forEach((item, index) => prioritizeExactMatch(item, index, 'title', recipeResults));
      tagResults.forEach((item, index) => prioritizeExactMatch(item, index, 'name', tagResults));

      function prioritizeExactMatch(item, index, criteria, arr) {
        if (term.toLowerCase() === item[criteria].toLowerCase()) {
          arr.unshift(arr.splice(index, 1)[0]);
        }
      }

      res.json({ recipeResults, tagResults });
    });
  });


  // Update recipe
  app.post('/api/recipe/:recipeID', loggedIn, upload.fields([{ name: 'image-asset' }]),(req, res) => {
    const { recipeID } = req.params;
    const { title, url, description, tags, favorite, image, removeImage } = req.body;

    const imageAsset = req.files['image-asset'] && req.files['image-asset'][0].path;

    if (recipeID === 'new') {
      User.findOne({ _id: req.session.passport.user._id }, (err, user) => {
        Recipe.find({ user_id: req.session.passport.user._id }, (err, recipes) => {
          // Check for recipe limit
          if (recipes.length >= recipeLimit && !hasPaidPlan(user)) {
            return res.json({ message: 'Limit reached' });
          } else {
            const newRecipe = new Recipe();
            newRecipe.user_id = req.session.passport.user._id;
            addRecipe(newRecipe);
          }
        });
      });

    } else {
      Recipe.findOne({ user_id: req.session.passport.user._id, _id: recipeID}, (err, recipe) => {
        if (err) console.error(err);
        addRecipe(recipe);
      });
    }

    function addRecipe(recipe) {
      recipe.favorite = favorite;
      recipe.title = title;
      recipe.url = url;
      recipe.description = description;
      recipe.tags = JSON.parse(tags);

      if (removeImage) recipe.image = '';
    
      if (imageAsset || image) {
        cloudinary.uploader.upload(imageAsset || image, result => {
          if (imageAsset) fs.unlink(imageAsset, err => {});
          console.log('cloudinary upload:', result.secure_url);
          recipe.image = result.secure_url;
          saveRecipe(recipe);
        },
        cloudinaryOptionsRecipe);
      } else {
        saveRecipe(recipe);
      }


      function saveRecipe(recipe) {
        recipe.save((err, recipe) => {
          if (err) console.error(err);
          res.json(recipe);
        });
      }
    }
  });


  // Delete recipe
  app.delete('/api/recipe/:recipeID', loggedIn, (req, res) => {
    console.log('delete recipe');
    const { recipeID } = req.params;

    Recipe.findOne({ user_id: req.session.passport.user._id, _id: recipeID}, (err, recipe) => {
      if (err) console.error(err);
      if (!recipe) return res.sendStatus(404);

      recipe.remove((err, data) => {
        if (err) console.error(err);
        res.json(data);
      });
    });
  });


  // Account page data
  app.get('/api/account', loggedIn, (req, res) => {
    User.findOne({ _id: req.session.passport.user._id }, 'creationDate email lastLogin name subscription profileImage facebookId googleId _id', (err, user) => {
      if (err) console.error(err);
      res.json(user);
    });
  });


  // Upload profile image
  app.post('/api/account-image-upload', loggedIn, upload.fields([{ name: 'image-file' }]), (req, res) => {

    const imageFile = req.files['image-file'][0].path;

    User.findOne({ _id: req.session.passport.user._id }, (err, user) => {
      if (err) console.error(err);

      // If the user has a profile image already then delete it
      if (user.profileImage) {
        const subStrPos = user.profileImage.lastIndexOf('/') + 1;
        const imageID = user.profileImage.substr(subStrPos).replace('.jpg', '');
        cloudinary.uploader.destroy(imageID, result => {
          saveImage();
        });
      } else {
        saveImage()
      }

      function saveImage() {
        cloudinary.uploader.upload(imageFile, result => {
          if (imageFile) fs.unlink(imageFile, err => {});
          user.profileImage = result.secure_url;

          user.save((err, record) => {
            if (err) console.error(err);
            res.json({
              profileImage: result.secure_url
            });
          });
        },
        cloudinaryOptionsProfile);
      }

    });
  });


  // Helper functions
  function sortObj(sort) {
    switch(sort) {
      case 'oldest':
        return { creationDate: 1 };
      case 'newest':
        return { creationDate: -1 };
      case 'a - z':
        return { title: 1 };
      case 'z - a':
        return { title: -1 };
      default:
        return { creationDate: -1 };
    }
  }

  function hasPaidPlan(user) {
    let isPaidPlan = false;

    if (/^Full/.test(user.subscription)) {
      isPaidPlan = true;
    } else if (/^Basic \(Subscription ended/.test(user.subscription)) {
      if (Date.now() < user.subEnds) {
        isPaidPlan = true;
      }
    }
  
    return isPaidPlan;
  }


}