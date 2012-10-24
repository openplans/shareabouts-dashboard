
  var apiRoot = 'http://sapistaging-civicworks.dotcloud.com/api/v1/datasets/openplans/chicagobikes/',
      meta,
      places,
      activity;

  function appendList($target, dataByProperty) {
      $target.empty();
      _.each(dataByProperty, function(obj) {
        $target.append('<tr><td class="key">'+obj.key+'</td><td>'+obj.val+'</td></tr>');
      });
  }

  function mapToCounts(placesByProp, max) {
    max = max || 10;

    var placesWithCounts = _.map(placesByProp, function(val, key, obj) {
      return {key: key, val: val.length};
    });

    return _.sortBy(placesWithCounts, function(obj) { return -obj.val; }).slice(0, max-1);
  }

  function groupByPlaceProperty(property) {
    var placesWithVal = _.filter(places, function(p) { return !!p[property]; }),
        placesByProp = _.groupBy(placesWithVal, function(p) { return p[property]; });

    return placesByProp;
  }

  $.getJSON(apiRoot + '?format=json-p&callback=?',
    function(data) {
      meta = data;
      $('#place-count').html(meta.places.length);
      $('#comment-count').html(_.find(meta.submissions, function(obj) { return obj.type==='comments'; }).length);
      $('#support-count').html(_.find(meta.submissions, function(obj) { return obj.type==='support'; }).length);
    });


  $.getJSON(apiRoot + 'places/?format=json-p&callback=?',
    function(data) {
      places = data;

      // appendList($('#placebytype-list'), mapToCounts(groupByPlaceProperty('location_type')));
      appendList($('#placebyregion-list'), mapToCounts(groupByPlaceProperty('region_name')));

      var placesBySupportCount = _.sortBy(places, function(p) {
        var supportSet = _.find(p.submissions, function(obj) { return obj.type==='support'; });
        return supportSet ? -supportSet.length : 0;
      });

      placesBySupportCount = _.map(placesBySupportCount.slice(0, 9), function(p) {
        var supportSet = _.find(p.submissions, function(obj) { return obj.type==='support'; });
            key = '<a href="http://map.chicagobikes.org/locations/'+p.v1_id+'" target="_blank">'+
                (p.region_name || '[Unknown]') + ' for ' + p.location_type+'</a>';
        return {key: key, val: supportSet.length};
      });

      appendList($('#placebysupportcount-list'), placesBySupportCount);
    });


  $.getJSON(apiRoot + 'activity/?format=json-p&limit=3&callback=?',
    function(data) {
      var $activityList = $('#activity-list');
      activity = data;

      $activityList.empty();
      _.each(activity, function(obj) {
        $activityList.append('<li>'+obj.data.description+'</li>');
      });
    });
