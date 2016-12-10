function _2Decimals(num) {
  return Math.round(num * 100) / 100;
}

$('.add-food-button').on('click', function(e) {
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
          $(li_element).html("<i class='fa fa-cutlery'></i><span>" +
            itemNameTrimmed + "<span>").
          find('span').css('display', 'inline-block').
          css('width', 'auto').parent().find('i').css('padding',
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
        $(inputAmount).addClass('form-control');
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
        $(select).addClass('form-control');

        var buttonDiv = document.createElement('div');
        var chooseFoodButton = document.createElement('button');
        $(chooseFoodButton).addClass('btn').addClass('btn-sm').addClass(
          'btn-primary').html('Add Food');
        $(buttonDiv).addClass('col-sm-3').append($(chooseFoodButton));

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
