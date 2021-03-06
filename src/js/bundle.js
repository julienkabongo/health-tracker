(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Food = require('./models');

var collections = exports;

collections.Foods = Backbone.Collection.extend({
  model: Food
});

collections.MyFoods = Backbone.Firebase.Collection.extend({
  model: Food,
  url: "https://healthtrackingbbone.firebaseio.com"
});
},{"./models":5}],2:[function(require,module,exports){
var app = require('./main');

// Individual food item view
module.exports = Backbone.View.extend({

  tagName: 'div',

  className: 'item',

  template: _.template($("#list-item-template").html()),

  events: {
    'click .addButton': 'addToMyFoods'
  },

  render: function() {
    return this.$el.html(this.template({
      item: this.model
    }));
  },

  // Add a food to My Foods collection on clicking "Add" button
  addToMyFoods: function(e) {
    e.preventDefault();
    this.model.set("added", true);
    app.myFoods.add(this.model);
    app.foods.remove(this.model);
  }
});
},{"./main":4}],3:[function(require,module,exports){
// Display an error message to user
module.exports = {
  displayErrorToUser: function(targetDOM, errorMessage, duration) {
    // Create a message and display it
    var pTag = document.createElement("p");
    pTag.setAttribute("class", "errorMessage");
    pTag.innerHTML = errorMessage;
    targetDOM.appendChild(pTag);

    // remove the message after 'duration' seconds
    setTimeout(function() {
      while (targetDOM.firstChild) {
        targetDOM.removeChild(targetDOM.firstChild);
      }
    }, duration);
  }
}

},{}],4:[function(require,module,exports){
"use strict";
var Router = require('./router');

var app = exports = app || {};

// Semantic UI - Toggle Active Class for Navigation Bar
$(document).ready(function() {
  $(".ui .item").on("click", function() {
    $(".ui .item").removeClass("active");
    $(this).addClass("active");
  });
});

// Initiate router
app.router = new Router();

// History
Backbone.history.start();

},{"./router":9}],5:[function(require,module,exports){
module.exports = Backbone.Model.extend({
  defaults: {
    added: false
  }
});


},{}],6:[function(require,module,exports){
var app = require('./main');

module.exports = Backbone.View.extend({

  tagName: 'div',

  className: 'item',

  template: _.template($("#list-item-template").html()),

  events: {
    'click .removeButton': 'removeFromMyFoods'
  },

  render: function() {
    return this.$el.html(this.template({
      item: this.model
    }));
  },

  // remove the clicked food from My Foods collection
  removeFromMyFoods: function(e) {
    e.preventDefault();
    app.myFoods.remove(this.model);
  }
});
},{"./main":4}],7:[function(require,module,exports){
// My Foods Header View
module.exports = Backbone.View.extend({
  el: '#main',

  initialize: function() {
    this.render();
  },

  render: function() {
    var template = _.template($("#myfoods-header-template").html());
    this.$el.html(template);
  }
});
},{}],8:[function(require,module,exports){
var MyFoodItemView = require('./myFoodItemView');

module.exports = Backbone.View.extend({
  el: '#resultList',

  // Everytime the My Foods collection is synced  or removes a food, re-render
  initialize: function() {
    this.listenTo(this.collection, 'sync remove', this.render);
  },

  render: function() {
    this.$el.empty();

    var self = this;
    var totalCalories = 0;
    var foodItem;

    // If the route is at "#/myfoods", run the code below
    if (window.location.hash === "#/myfoods") {

      // Iterate through the My Foods collection to
      // append/display each food in the My Food List
      _(self.collection.models).each(function(item) {
        foodItem = new MyFoodItemView({
          collection: self.collection,
          model: item
        });
        self.$el.append(foodItem.render());

        totalCalories += item.get("calories");
      }, this);

      // Display the calculated total calories
      $("#totalCalories").text(Math.round(totalCalories * 100) / 100);
    }
  }
});
},{"./myFoodItemView":6}],9:[function(require,module,exports){
var app = require('./main');
var Foods = require('./collections').Foods;
var MyFoods = require('./collections').MyFoods;
var SearchBoxView = require('./searchBoxView');
var SearchResultView = require('./searchResultView');
var MyFoodsHeaderView = require('./myFoodsHeaderView');
var MyFoodsView = require('./myFoodsView');

// Create each instance of Collection and View required
app.foods = new Foods();
app.myFoods = new MyFoods();
app.searchBoxView = new SearchBoxView();
app.searchResultView = new SearchResultView({
  collection: app.foods
});
app.myFoodsHeaderView = new MyFoodsHeaderView();
app.myFoodsView = new MyFoodsView({
  collection: app.myFoods
});

// Routing logic
module.exports = Backbone.Router.extend({
  routes: {
    "": "search",
    "myfoods": "myfoods"
  },

  search: function() {
    app.searchBoxView.render();
    app.foods.reset();
    app.searchResultView.render();
  },

  myfoods: function() {
    app.myFoodsHeaderView.render();
    app.myFoodsView.render();
  }
});
},{"./collections":1,"./main":4,"./myFoodsHeaderView":7,"./myFoodsView":8,"./searchBoxView":10,"./searchResultView":11}],10:[function(require,module,exports){
var helpers = require('./helpers');
var Food = require('./models');
var app = require('./main');
var error = document.getElementById("error");

// Use Search Form to fetch data from Nutritionix server
// and display the data as a list
module.exports = Backbone.View.extend({
  el: $("#main"),

  initialize: function() {
    this.render();
  },

  // Fire fetchData() on search with a keyword
  events: {
    "submit form": "fetchData"
  },

  // Makes ajax call to fetch the foods data from Nutritionix server
  fetchData: function(e) {
    e.preventDefault();

    var self = this;
    var foodName = $(e.currentTarget).find("input[type=text]").val().trim();
    var searchTerm = foodName.replace(/ /g, "%20");
    var url = "https://api.nutritionix.com/v1_1/search/" + searchTerm + "?results=0%3A20&cal_min=0&cal_max=50000&fields=item_name%2Citem_id%2Cbrand_name%2Cnf_calories%2Cnf_total_fat&appId=b301fa4c&appKey=dc12f0d56ee2507d0393345103cb64fa";

    if (foodName.length === 0) {

      // Display error message and remove it after 2 seconds
      helpers.displayErrorToUser(error, "Type a food keyword please ...", 2000);

    } else {

      $.ajax({
        type: "GET",
        url: url,
        dataType: "JSON",
        success: function(data) {
          app.foods.reset();

          if (data && data.hits.length > 0) {
            var id;
            var brandName;
            var itemName;
            var calories;
            var servingSize;
            var servingUnit;
            var totalFat;
            var food;

            // Iterate through the fetched data in order to
            // create a model and add it to foods collection
            for (var i = 0; data.hits.length > i; i++) {
              id = data.hits[i].fields.item_id;
              brandName = data.hits[i].fields.brand_name;
              itemName = data.hits[i].fields.item_name;
              calories = data.hits[i].fields.nf_calories;
              servingSize = data.hits[i].fields.nf_serving_size_qty;
              servingUnit = data.hits[i].fields.nf_serving_size_unit;
              totalFat = data.hits[i].fields.nf_total_fat || "N/A";

              // Create a food model
              app.food = new Food({
                id: id,
                brandName: brandName,
                itemName: itemName,
                calories: calories,
                servingSize: servingSize,
                servingUnit: servingUnit,
                totalFat: totalFat
              });

              // Add each food model to foods collection
              app.foods.add(app.food);
            }
          } else {
            // Display error message and remove it after 2 seconds
            helpers.displayErrorToUser(error, "No Result with the keyword...", 2000);
          }

          self.render();
        },

        error: function() {
          // Display error message and remove it after 2 seconds
          helpers.displayErrorToUser(error, "Error on fetching data...", 2000);
        }
      });

    }

  },

  render: function() {
    var template = _.template($("#search-page-template").html());
    this.$el.html(template);
  }
});
},{"./helpers":3,"./main":4,"./models":5}],11:[function(require,module,exports){
var FoodItemView = require('./foodItemView');

// Display returned foods data on search view
module.exports = Backbone.View.extend({

  el: $("#resultList"),

  // Everytime fetched the food data from server (add each food to Foods collection), or
  // add the clicked food to My Foods collection (remove from Foos collection), re-render
  initialize: function() {
    this.listenTo(this.collection, 'add remove', this.render);
  },

  render: function() {
    this.$el.empty();
    var self = this;
    var foodItem;

    // Iterate through the collection in order to
    // create individual item views and
    // append/display each to Result List view
    _(this.collection.models).each(function(item) {
      foodItem = new FoodItemView({
        model: item
      });
      self.$el.append(foodItem.render());
    }, this);
  }
});
},{"./foodItemView":2}]},{},[4]);
