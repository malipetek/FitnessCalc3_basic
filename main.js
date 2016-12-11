function _2Decimals(num) {
  return Math.round(num * 100) / 100;
}

$(document).on('click', '.add-food-button', function(e) {
  $(this).parent().append($('#add-food-panel'));
  $('#add-food-panel').slideToggle(300);
  console.log(e);
});

$foodSearch = $('#food-search-input');

$foodSearch.on('change', searchFood);
//$('#search-button').on('click', searchFood);

function searchFood(e) {
  $query = $('#food-search-input').val();
  $.getJSON(
    'https://api.nal.usda.gov/ndb/search/?format=json&sort=n&max=10&offset=0&api_key=omcaFN9P4v5xb3l2VM7EqPyxwWRPjkg31EivJ4Jb&q=' +
    encodeURIComponent($query),
    function(res) {
      if (res.errors) {
        $('.search-result-panel').slideUp();
      } else {
        $('.search-result-panel').slideDown();
        $list = $('.search-result-list');
        $list.find('li').slideUp('fast', function() {
          $(this).remove();
        });
        var listArray = res.list.item;
        $.each(listArray, function(index, item) {
          var li_element = document.createElement(
            'li');
          li_element.classList.add('list-group-item');
          li_element.setAttribute('data-food-db-no',
            item.ndbno);
          var splittedArray = item.name.split(',');
          var firstPart = splittedArray[0];
          var itemNameTrimmed = "";
          var brand;

          if (splittedArray.length == 2) {
            itemNameTrimmed = firstPart;
          } else {
            $.each(splittedArray, function(index,
              item) {
              if (item.indexOf('UPC') !== -1 ||
                item.indexOf('GTIN') !== -1) {
                console.log(item);
              } else if (index == 0) {
                brand = "(" + item + ")";
              } else {
                itemNameTrimmed += item + ", ";
              }
            });
            itemNameTrimmed += brand;
          }
          $(li_element).html(
            "<i class='fa fa-cutlery'></i><span>" +
            itemNameTrimmed + "</span>").
          find('span').addClass('food-label').css('display',
            'inline-block').
          css('width', '80%').parent().find('i').css('padding',
            '5px');

          li_element.style.display = 'none';
          $list.append(li_element);
          $(li_element).slideDown();
        });
      }
    });
}

$(document).on('click', '.search-result-list li', function(e) {
  console.log($(this));
  $element = $(this);
  $val = $(this).text();
  $dbid = $(this).attr('data-food-db-no');
  if ($element.find('.nutrientList').length == 0 && $element.hasClass(
      'list-group-item')) {
    $.ajax({
      url: 'https://api.nal.usda.gov/ndb/reports/',
      type: 'GET',
      data: {
        ndbno: $dbid,
        type: 'b',
        format: 'json',
        api_key: 'omcaFN9P4v5xb3l2VM7EqPyxwWRPjkg31EivJ4Jb'
      },
      success: function(res) {
        var divToExpand = document.createElement('ul');
        $(divToExpand).css('display', 'none').css(
          'background-color', '#f3f3f3').css('padding',
          '15px').css('color', '#313534').css('margin',
          '10px 0 0 0').addClass('divtoexpand');



        $foodObject = res.report.food;
        $nutrientsArray = res.report.food.nutrients;
        /*==============GET MEASURES =========================*/

        if (res.report.food.nutrients.length !== -1) {
          $measuresArrayDefault = res.report.food.nutrients[0].measures;
          $measuresArray = [];
          $.each($measuresArrayDefault, function(ind, obj) {
            $measureName = obj.label;
            $measureGram = (obj.eqv / obj.qty);
            $measuresArray.push({
              measure: $measureName,
              weightOfMeasure: $measureGram
            });
          });

        }

        /* ============ Measure got $measuresArray = [{measure: ..., weightOfMeasure: ...g}] =========*/

        var div3 = document.createElement('div');
        $(div3).addClass('col-sm-3');
        var inputAmount = document.createElement('input');
        $(inputAmount).addClass('form-control').addClass(
          'amount-selection');
        $(inputAmount).attr('value', ($nutrientsArray[0].measures[0].qty))
          .attr('type', 'text');

        $(divToExpand).html(
          '<div class="col-sm-3"><strong>Amount:</strong></div>'
        );
        $(div3).append(inputAmount);
        $(divToExpand).append(div3);

        var dropdown = document.createElement('div');
        $(dropdown)
          .addClass('col-sm-3') /*.addClass('col-sm-offset-2');*/ ;
        var select = document.createElement('select');
        $(select).addClass('form-control').addClass('unit-selection');

        var buttonDiv = document.createElement('div');
        var chooseFoodButton = document.createElement('button');
        $(chooseFoodButton).addClass('btn').addClass('btn-sm').addClass(
          'btn-primary').html('Add Food');
        $(buttonDiv).addClass('col-sm-3').append($(chooseFoodButton));

        $(chooseFoodButton).on('click', addFoodToMeal);

        $.each($measuresArray, function(ind,
          obj) {
          var option = document.createElement('option');
          $(option).html(obj.measure);
          $(select).append($(option));
        });
        $(dropdown).append($(select));
        $(divToExpand).append(
          $(dropdown));
        $(divToExpand).append($(buttonDiv));
        $(divToExpand).append(
          '<br/><hr/><h5> Nutrients <h5>');

        function updateList(amount, preferedMeasure) {
          var listOfNutrients = document.createElement('ul');
          $(listOfNutrients).addClass('nutrientList');

          $.each($nutrientsArray, function(index, value) {
            $nutrientName = value.name;
            $unit = value.unit;
            $valuePerHundredGrams = value.value;
            $measures = value.measures;

            $defaultMeasure = $measures[0].label;
            $defaultMeasureQuantity = $measures[0].qty;
            $defaultMeasureValue = $measures[0].value;

            $measureChoosen = "";
            $measureChoosenAmount = "";
            $measureChoosenValue = "";
            $valueOfNutrient = "";

            if (preferedMeasure) {
              $.each($measures, function(ind, measureObj) {
                if (measureObj.label == preferedMeasure) {
                  $measureChoosen = measureObj.label;
                  $measureChoosenAmount = measureObj.qty;
                  $measureChoosenValue = measureObj.value;
                }
              });
            } else {
              $measureChoosen = $defaultMeasure;
              $measureChoosenAmount = $defaultMeasureQuantity;
              $measureChoosenValue = $defaultMeasureValue;
            }

            if (amount) {
              $valueOfNutrient = ($measureChoosenValue /
                $measureChoosenAmount) * amount;
            } else {
              $valueOfNutrient = $defaultMeasureValue;
            }
            var li = document.createElement('li');
            $(li).html(
              "<strong>" + $nutrientName +
              "</strong> : " +
              "<span class='value-per-measure'>" +
              _2Decimals($valueOfNutrient) + $unit +
              "</span> <span class='per-tag'>/per " +
              _2Decimals(amount) + " " +
              $measureChoosen +
              "</span>");
            $(listOfNutrients).append($(li));
          });

          if ($(divToExpand).find('.nutrientList').length !== 0) {
            $(divToExpand).find('.nutrientList').remove();
          }
          $(divToExpand).append($(listOfNutrients));


        }

        updateList($(inputAmount).val());

        $(select).on('change', function(e) {
          updateList($(inputAmount).val(), e.target.value);
        });

        $(inputAmount).on('change keyup paste', function(e) {
          updateList(e.target.value, $(select).val());
        });

        $element.append($(divToExpand));
        $(divToExpand).slideDown();
      }
    });

  } else {
    $element.find('.divtoexpand').slideToggle();
  }
})
$(document).on('click', '.divtoexpand', function(e) {
  return false;
});

$(document).on('click', '.close-food-panel', function() {
  $(this).parent().parent().parent().slideUp();
});

/*= == == = == = = = = = = = = = == = = = = = =*/
function addFoodToMeal(e) {
  $item = $(e.currentTarget).closest('.list-group-item');
  $mealContainer = $(e.currentTarget).closest('.day-row');
  $label = $item.children('span').text();
  $dbno = $item.attr('data-food-db-no');

  $unit = $item.find('.unit-selection').val();
  $amount = $item.find('.amount-selection').val();

  $cloned = $item.clone();
  $cloned.attr('data-amount', $amount).attr(
    'data-unit', $unit).attr('data-label', $label);
  $labelCl = $cloned.children('span');
  $labelCl.append('<span class="per-tag">' + $amount + ' ' + $unit +
    '</span>');
  $(
    '<span class="pull-right glyphicon glyphicon-remove food-saved-remove"></span>'
  ).insertAfter($labelCl);
  $cloned.css('transform', 'scale(1.1)');
  $mealContainer.find('.added-food').append($cloned);
  $cloned.find('.divtoexpand').hide();
  $item.find('.divtoexpand').slideUp();
  $cloned.css('transform', 'scale(1)');

  //console.log($text);
}

/////////////// DATE PICKER /////////////////////
var today = new Date();
var currentDate = new Date();
$("#datepicker").datepicker({
  showOn: "button",
  buttonText: '<span style="font-size: 16px; padding: 5px" class="glyphicon glyphicon-calendar"></span>',
  buttonImageOnly: false,
  dateFormat: 'DD, dd.mm.yy'
}).datepicker('setDate', currentDate);
dateChangeHandler();

$('.next-day-button').click(function(e) {
  currentDate.setDate(currentDate.getDate() + 1);
  $("#datepicker").datepicker('setDate', currentDate);
  dateChangeHandler();
});
$('.prev-day-button').click(function(e) {
  currentDate.setDate(currentDate.getDate() - 1)
  $("#datepicker").datepicker('setDate', currentDate);
  dateChangeHandler();
});

$('#datepicker').on('change', dateChangeHandler);

$('.day-container').attr('data-date', currentDate.toDateString());



function dateChangeHandler() {
  $newDate = $('#datepicker').datepicker('getDate').toDateString();

  /*=== === === === CHECK FOR TODAY === === ===*/
  if ($newDate == today.toDateString()) {
    $('#datepicker').css('background-color', '#eee');
  } else {
    $('#datepicker').css('background-color', '#fff');
  }
  /*=== === === === CHECK FOR TODAY === === ===*/

  $breakfast = [];
  $lunch = [];
  $dinner = [];
  $snack = [];

  $.ajax({
    url: 'dummyobj.json',
    type: 'GET',
    data: {
      //date: $newDate //yy.mm.dd
    },
    success: function(res) {

      $.each(res.meals, function(ind, obj) {
        if (obj.mealType == "BREAKFAST") {
          $breakfast = obj.foodConsumptions;
        }
        if (obj.mealType == "LUNCH") {
          $lunch = obj.foodConsumptions;
        }
        if (obj.mealType == "DINNER") {
          $dinner = obj.foodConsumptions;
        }
        if (obj.mealType == "SNACK") {
          $snack = obj.foodConsumptions;
        }
      });
      updateDay();
    }
  });

  function updateDay() {
    console.log($breakfast);

    if ($('.day-container[data-date="' + $newDate + '"]').length == 0) {
      $('.day-container').fadeOut().remove();
      $newDay = $('.day-container-template').clone();
      $('.content').append($newDay);
      $newDay.attr('class', 'row').addClass('day-container').attr(
        'data-date', $newDate).fadeIn();
    } else {
      $('.day-container').fadeOut();
      $('.day-container[data-date="' + $newDate + '"]').fadeIn();
    }

    function foodItemGenerate(label, amount, unit) {
      $item = $('.food-li-template').clone();
      $item.css('display', 'block');
      $item.attr('class', 'list-group-item');
      $item.attr('data-food-db-no', '');
      $item.attr('data-label', label);
      $item.attr('data-amount', amount);
      $item.attr('data-unit', unit);
      $perTag = $item.find('.per-tag').text(amount + ' ' + unit).detach();
      $item.find('.food-label').text(label).append($perTag);

      return $item;
    }

    $.each($breakfast, function(ind, val) {

      $label = val.food.name;
      $amount = val.quantity;
      $unit = val.unit.name;

      console.log($label);
      $newDay.find('.breakfast').find('.added-food').append(
        foodItemGenerate($label, $amount, $unit));
    });
    $.each($lunch, function(ind, val) {
      $label = val.food.name;
      $amount = val.quantity;
      $unit = val.unit.name;
      $newDay.find('.lunch').find('.added-food').append(
        foodItemGenerate($label, $amount, $unit));
    });
    $.each($dinner, function(ind, val) {
      $label = val.food.name;
      $amount = val.quantity;
      $unit = val.unit.name;
      $newDay.find('.dinner').find('.added-food').append(
        foodItemGenerate($label, $amount, $unit));
    });
    $.each($snack, function(ind, val) {
      $label = val.food.name;
      $amount = val.quantity;
      $unit = val.unit.name;
      $newDay.find('.snack').find('.added-food').append(
        foodItemGenerate($label, $amount, $unit));
    });

    console.log($newDate);
    console.log(today.toDateString());
  }
}
/////////////// DATE PICKER /////////////////////

var CalcUserData = function() {
  this.dates = [];
  this.meals = [];
  this.food = [];

  this.addFood = function() {

  };
  this.removeFood = function() {

  };
  this.addDate = function() {

  };
  this.reportChanges = function() {

  };
}

function wrapToJson(dayContainerElement) {
  $(dayContainerElement).find('.breakfast')

  function saveLists(meal) {
    $foods = $(dayContainerElement).find('.' + meal).find('.added-food').find(
      'li');
    $exercises = $(dayContainerElement).find('.' + meal).find(
        '.added-exercise')
      .find('li');
    foodsArray = [];
    excercisesArray = [];
    $.each($foods, function(ind, val) {
      $label = val.attr('data-label');
      $amount = val.attr('data-amount');
      $unit = val.attr('data-unit');
      $ndbno = val.attr('data-food-db-no');
      foodObject = {
        foodName: $label,
        ndbno: $ndbno,
        amount: $amount,
        unit: $unit
      };
      foodsArray.push(foodObject);
    });
  }
}
/* userData = {
  user: {
    userid: 'UserId',
    dates: [{
      date: date();
      meals: {
        breakfast: [foodsArray],
        launch: [foodsArray],
        dinner: [foodsArray],
        snacks: [foodsArray]
      },
      excercises: [excercisesArray]
    }]
  }
}
food = {
  label: "string",
  ndbno: "number",
  amount: "number",
  unit: "string",
  value: "gram equivalent of amount/unit"
}
*/
