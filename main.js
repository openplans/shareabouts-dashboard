  var apiRoot = 'http://api.shareabouts.org/api/v1/openplans/datasets/chicagobikes/',
      meta,
      places,
      activity;

  // jQuery should not send the cache-busting parameter
  $.ajaxSetup({
    cache: true,
    dataType: 'jsonp'
  });

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

  $.ajax({
    url: apiRoot + '?format=json-p',
    jsonpCallback: '_shareaboutsProcessDataset',
    success: function(data) {
      meta = data;
      $('#place-count').html(meta.places.length);
      $('#comment-count').html(_.find(meta.submissions, function(obj) { return obj.type==='comments'; }).length);
      $('#support-count').html(_.find(meta.submissions, function(obj) { return obj.type==='support'; }).length);
    }
  });


  $.ajax({
    url: apiRoot + 'places/?format=json-p',
    jsonpCallback: '_shareaboutsProcessPlaces',
    success: function(data) {
      places = data;

      // Taking this out because a place can have multiple location types
      // appendList($('#placebytype-list'), mapToCounts(groupByPlaceProperty('location_type')));

      appendList($('#placebyregion-list'), mapToCounts(groupByPlaceProperty('region_name')));

      var placesBySupportCount = _.sortBy(places, function(p) {
        var supportSet = _.find(p.submissions, function(obj) { return obj.type==='support'; });
        return supportSet ? -supportSet.length : 0;
      });

      placesBySupportCount = _.map(placesBySupportCount.slice(0, 5), function(p) {
        var supportSet = _.find(p.submissions, function(obj) { return obj.type==='support'; }),
            neighborhood = p.region_name || '[Unknown]',
            types,
            key;

        if (p.location_type && p.location_type.length > 1) {
          types = p.location_type.splice(p.location_type.length-2, 2).join(' and ');
          p.location_type.push(types);

          types = p.location_type.join(', ');
        }

        key = '<a href="http://map.chicagobikes.org/locations/'+p.v1_id+'" target="_blank">'+
                neighborhood + (types ? ' for ' + types : '') +'</a>';
        return {key: key, val: supportSet.length};
      });

      appendList($('#placebysupportcount-list'), placesBySupportCount);
    }
  });

  function appendActivity(activity, $activityList) {
    $activityList.empty();
    _.each(activity, function(obj) {
      var name = obj.data.submitter_name || 'Someone',
          verb = 'suggested',
          place = _.find(places, function(p) { return p.id === obj.data.id; }),
          where = '',
          msg;

      // If no place was found, then bail.
      if (!place) {
        console.log('skipped a place');
        return;
      }

      if (obj.type === 'comments') {
        verb = 'commented on';
      } else if (obj.type === 'support') {
        verb = 'supported';
      }

      if (place.region_name) {
        where = ' in ' + place.region_name;
      }

      msg = name + ' ' + verb + ' a <a href="http://map.chicagobikes.org/locations/'+
        place.v1_id+'">place</a>' + where + '.';

      if (obj.data.description) {
        msg += '<p class="small"><em>"'+obj.data.description+'"</em></p>';
      }

      $activityList.append('<li>'+msg+'</li>');
    });
  }

  $.ajax({
    url: apiRoot + 'activity/?format=json-p&limit=7',
    jsonpCallback: '_shareaboutsProcessActivity',
    success: function(data) {
      activity = data;

      var id = setInterval(function() {
        if (places) {
          clearInterval(id);
          appendActivity(activity, $('#activity-list'));
        }
      }, 200);
    }
  });
