$('#add-food-button').on('click', function() {
  $('#add-food-panel').slideToggle(300);
});

$foodSearch = $('#food-search-input');

$foodSearch.on('change', function(e) {
  $query = $(this).val();
  $.getJSON(
    'https://api.nal.usda.gov/ndb/search/?format=json&sort=n&max=200&offset=0&api_key=omcaFN9P4v5xb3l2VM7EqPyxwWRPjkg31EivJ4Jb&q=' +
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
          li_element.innerHTML = itemNameTrimmed;
          li_element.style.display = 'none';
          $list.append(li_element);
          $(li_element).slideDown();
        });
      }
    });
});

$(document).on('click', '.search-result-list li', function() {
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
          '5px 20px').css('color', '#313534');
        var listOfNutrients = document.createElement('ul');
        $(listOfNutrients).addClass('nutrientList');


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

        $(divToExpand).html(
          '<div class="col-sm-1"><strong>Amount:</strong></div><div class="col-sm-3"><input value="' +
          ($nutrientsArray[0].measures[0].qty) +
          '" class="form-control" type="text"></div>'
        );
        var dropdown = document.createElement('div');
        $(dropdown)
          .addClass('col-sm-4') /*.addClass('col-sm-offset-2');*/ ;
        var select = document.createElement('select');
        $(select).addClass(
          'form-control');
        $.each($measuresArray, function(ind,
          obj) {
          var option = document.createElement('option');
          $(option).html(obj.measure);
          $(select).append($(option));
        });
        $(dropdown).append($(select));
        $(divToExpand).append(
          $(dropdown));
        $(divToExpand).append(
          '<br/><hr/><h5> Nutrients <h5>');

        function updateList(amount, preferedMeasure) {
          $.each($nutrientsArray, function(index, value) {
            $nutrientName = value.name;
            $unit = value.unit;
            $valuePerMeasure = value.value;
            $measures = value.measures;
            $defaultMeasure = $measures[0].label;
            $defaultMeasureAmount = $measures[0].qty;
            $measureChoosen = "";
            $measureChoosenAmount = "";
            if (preferedMeasure) {
              console.log(another);
            } else {
              $measureChoosen = $defaultMeasure;
              $measureChoosenAmount = $defaultMeasureAmount;
            }
            var li = document.createElement('li');
            $(li).html("<strong>" + $nutrientName +
              "</strong> : " +
              "<span class='value-per-measure'>" +
              $valuePerMeasure + $unit +
              "</span> <span class='per-tag'>/per " +
              $measureChoosenAmount + " " + $measureChoosen +
              "</span>");
            $(listOfNutrients).append($(li));
          });
          $(divToExpand).append($(listOfNutrients));
        }

        updateList(1);

        $element.append($(divToExpand));
        $(divToExpand).slideDown();
      }
    });

  }
});
